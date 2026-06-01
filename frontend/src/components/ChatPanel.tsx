"use client";
import { useState, useRef, useEffect } from "react";
import { Message } from "@/app/page";

type Props = {
  messages: Message[];
  loading: boolean;
  onSubmit: (question: string) => void;
};

const HINTS = [
  "What are the obligations for high-risk AI providers?",
  "Does the EU AI Act apply to open-source models?",
  "What are the transparency requirements for chatbots?",
];

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ol key={`list-${elements.length}`} style={{ paddingLeft: 20, margin: "8px 0", display: "flex", flexDirection: "column", gap: 6 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ol>
      );
      listItems = [];
    }
  }

  function boldify(str: string) {
    return str.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#60a5fa;font-weight:500">$1</strong>');
  }

  lines.forEach((line, i) => {
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      listItems.push(numberedMatch[1]);
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<div key={i} style={{ height: 6 }} />);
      } else {
        elements.push(
          <p key={i} style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        );
      }
    }
  });

  flushList();
  return elements;
}

export default function ChatPanel({ messages, loading, onSubmit }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit() {
    if (!input.trim() || loading) return;
    onSubmit(input.trim());
    setInput("");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "0.5px solid #1e2530" }}>
      <div style={{
        flex: 1, overflowY: "auto", padding: "24px",
        display: "flex", flexDirection: "column", gap: 20,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, marginTop: 80,
          }}>
            <p style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>Query the EU AI Act</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 420 }}>
              {HINTS.map((hint, i) => (
                <div key={i} onClick={() => onSubmit(hint)} style={{
                  fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace",
                  background: "#111827", border: "0.5px solid #1e2530",
                  padding: "8px 14px", borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f6";
                    (e.currentTarget as HTMLDivElement).style.color = "#60a5fa";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#1e2530";
                    (e.currentTarget as HTMLDivElement).style.color = "#334155";
                  }}
                >
                  {hint}
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "user" ? (
              <div style={{
                maxWidth: "70%", background: "#1d2d44", border: "0.5px solid #2d4a6e",
                color: "#93c5fd", fontSize: 12, padding: "10px 14px",
                borderRadius: "10px 10px 2px 10px", lineHeight: 1.6,
                fontFamily: "'DM Mono', monospace",
              }}>
                {msg.content}
              </div>
            ) : (
              <div style={{ maxWidth: "85%" }}>
                <div style={{
                  fontSize: 10, color: "#334155", marginBottom: 5,
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em",
                }}>
                  ASSISTANT{msg.sourceCount ? ` · ${msg.sourceCount} sources retrieved` : ""}
                </div>
                <div style={{
                  background: "#111827", border: "0.5px solid #1e2530",
                  padding: "14px 18px", borderRadius: "2px 10px 10px 10px",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  {renderMarkdown(msg.content)}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div>
              <div style={{
                fontSize: 10, color: "#334155", marginBottom: 5,
                fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em",
              }}>
                RETRIEVING CONTEXT...
              </div>
              <div style={{
                background: "#111827", border: "0.5px solid #1e2530",
                padding: "12px 16px", borderRadius: "2px 10px 10px 10px",
                display: "flex", gap: 6, alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, background: "#3b82f6", borderRadius: "50%",
                    animation: "bounce 1s infinite", animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "14px 24px", borderTop: "0.5px solid #1e2530",
        display: "flex", gap: 10, background: "#0d1017",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask about the EU AI Act..."
          style={{
            flex: 1, background: "#111827", border: "0.5px solid #1e2530",
            borderRadius: 8, padding: "10px 14px", color: "#e2e8f0",
            fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#111827" : "#1d3461",
            border: "0.5px solid #2d4a6e",
            color: loading || !input.trim() ? "#334155" : "#60a5fa",
            padding: "10px 18px", borderRadius: 8, fontSize: 12,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif", fontWeight: 500, transition: "all 0.15s",
          }}
        >
          Send →
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
