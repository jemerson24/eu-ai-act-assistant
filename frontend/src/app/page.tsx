"use client";
import { useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import SourcesPanel from "@/components/SourcesPanel";
import ClassifierPanel from "@/components/ClassifierPanel";

export type Source = {
  page: number;
  text: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  sourceCount?: number;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"qa" | "classifier">("qa");

  async function handleQuery(question: string) {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      const res = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sourceCount: data.sources.length },
      ]);
      setSources(data.sources);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to backend. Is it running on port 8000?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#0a0c0f",
      fontFamily: "'Syne', sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "0.5px solid #1e2530",
        background: "#0d1017",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>EU</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", letterSpacing: "0.02em" }}>
              AI Act Assistant
            </div>
            <div style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
              rag · gpt-4o · qdrant
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4,
          background: "#111827",
          borderRadius: 8, padding: 3,
        }}>
          {(["qa", "classifier"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.03em",
                background: activeTab === tab ? "#1d2d44" : "transparent",
                color: activeTab === tab ? "#60a5fa" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {tab === "qa" ? "Q&A" : "Risk Classifier"}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      {activeTab === "qa" ? (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ChatPanel messages={messages} loading={loading} onSubmit={handleQuery} />
          <SourcesPanel sources={sources} />
        </div>
      ) : (
        <ClassifierPanel />
      )}

      {/* Status bar */}
      <div style={{
        padding: "6px 24px",
        borderTop: "0.5px solid #1e2530",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#0d1017",
      }}>
        <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%" }} />
        <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
          qdrant · 1429 chunks indexed
        </span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
          gpt-4o · temp 0 · k=5
        </span>
      </div>
    </div>
  );
}
