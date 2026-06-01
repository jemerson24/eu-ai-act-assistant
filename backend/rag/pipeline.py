import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser


def get_qa_llm():
    return ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=1024)

def get_classifier_llm():
    return ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=512)


QA_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are an EU AI Act legal assistant. Give clear, practical answers to compliance officers and developers.

FORMAT RULES — follow exactly:
1. Start with a single plain-English summary sentence
2. List each key point as: "- [action or obligation] (Article X)"
3. End with: "Takeaway: [one practical sentence a developer or compliance officer can act on]"

RULES:
- Use "- " (dash space) for every list item
- Cite the article in parentheses at end of each point like (Article 16)
- Plain English only — no legal jargon, no copying verbatim from the Act
- Only use information from the provided context
- If context doesn't contain the answer, say: "The provided context does not contain enough information. Please consult the full EU AI Act text."

EXAMPLE OF PERFECT FORMAT:
Q: What are transparency requirements for AI systems?
A: AI systems interacting with humans must clearly disclose they are AI.
- Notify users they are interacting with an AI system, unless this is obvious (Article 50)
- Disclose when content is AI-generated, including deepfakes (Article 50)
- Ensure chatbots identify themselves as artificial at the start of interactions (Article 50)
Takeaway: If your system talks to people, it must say it is an AI — no exceptions.

---

Context:
{context}

Question: {question}

Answer:"""
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def get_qa_chain_with_sources(retriever):
    llm = get_qa_llm()

    def run(question: str) -> dict:
        docs = retriever.invoke(question)
        context = format_docs(docs)
        prompt = QA_PROMPT.format(context=context, question=question)
        answer = llm.invoke(prompt).content
        return {"result": answer, "source_documents": docs}

    return run


CLASSIFIER_PROMPT = PromptTemplate(
    input_variables=["description"],
    template="""You are an EU AI Act compliance expert.

Given a description of an AI system, classify it according to the EU AI Act risk framework.

Respond ONLY with a valid JSON object — no preamble, no explanation, no markdown fences.

JSON format:
{{
  "risk_level": "High" | "Limited" | "Minimal",
  "reasoning": "2-3 sentence explanation in plain English, citing the EU AI Act",
  "relevant_article": "e.g. Article 6, Annex III",
  "annex_entry": "specific Annex III entry if applicable, otherwise null"
}}

AI system description:
{description}"""
)

def run_classifier(description: str) -> dict:
    llm = get_classifier_llm()
    chain = CLASSIFIER_PROMPT | llm | StrOutputParser()

    try:
        raw = chain.invoke({"description": description}).strip()

        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)

        required_keys = {"risk_level", "reasoning", "relevant_article", "annex_entry"}
        if not required_keys.issubset(result.keys()):
            raise ValueError(f"Missing keys: {result.keys()}")

        result["risk_level"] = result["risk_level"].capitalize()
        if result["risk_level"] not in ("High", "Limited", "Minimal"):
            result["risk_level"] = "Unknown"

        return result

    except (json.JSONDecodeError, ValueError) as e:
        return {
            "risk_level": "Unknown",
            "reasoning": f"Could not parse classifier response. Error: {str(e)}",
            "relevant_article": None,
            "annex_entry": None,
        }
