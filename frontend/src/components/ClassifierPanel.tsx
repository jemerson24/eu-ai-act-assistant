"use client";
import { useState } from "react";

type ClassifyResult = {
  risk_level: string;
  reasoning: string;
  relevant_article: string | null;
  annex_entry: string | null;
};

const RISK_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  High:    { bg: "#1a0f0f", border: "#7f1d1d", text: "#f87171", label: "HIGH RISK" },
  Limited: { bg: "#1a1500", border: "#713f12", text: "#fbbf24", label: "LIMITED RISK" },
  Minimal: { bg: "#0a1a0f", border: "#14532d", text: "#4ade80", label: "MINIMAL RISK" },
  Unknown: { bg: "#111827", border: "#1e2530", text: "#475569", label: "UNKNOWN" },
};

export default function ClassifierPanel() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClassify() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/classify-system`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const risk = result ? (RISK_COLORS[result.risk_level] || RISK_COLORS.Unknown) : null;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "40px 24px",
      overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{
          fontSize: 10,
          color: "#475569",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.08em",
          marginBottom: 16,
        }}>
          RISK CLASSIFIER · EU AI ACT
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your AI system..."
          style={{
            width: "100%",
            height: 120,
            background: "#111827",
            border: "0.5px solid #1e2530",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#e2e8f0",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            resize: "none",
            outline: "none",
            lineHeight: 1.6,
          }}
        />

        <button
          onClick={handleClassify}
          disabled={loading || !description.trim()}
          style={{
            marginTop: 10,
            background: loading || !description.trim() ? "#111827" : "#1d3461",
            border: "0.5px solid #2d4a6e",
            color: loading || !description.trim() ? "#334155" : "#60a5fa",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 12,
            cursor: loading || !description.trim() ? "not-allowed" : "pointer",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            transition: "all 0.15s",
          }}
        >
          {loading ? "Classifying..." : "Classify System →"}
        </button>

        {result && risk && (
          <div style={{
            marginTop: 24,
            background: risk.bg,
            border: `0.5px solid ${risk.border}`,
            borderRadius: 10,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <span style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                fontWeight: 500,
                color: risk.text,
                letterSpacing: "0.08em",
              }}>
                {risk.label}
              </span>
            </div>

            <div>
              <div style={{
                fontSize: 10,
                color: "#475569",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.05em",
                marginBottom: 6,
              }}>
                REASONING
              </div>
              <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                {result.reasoning}
              </p>
            </div>

            {result.relevant_article && (
              <div>
                <div style={{
                  fontSize: 10,
                  color: "#475569",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}>
                  RELEVANT ARTICLE
                </div>
                <p style={{
                  fontSize: 12,
                  color: "#60a5fa",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {result.relevant_article}
                </p>
              </div>
            )}

            {result.annex_entry && (
              <div>
                <div style={{
                  fontSize: 10,
                  color: "#475569",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}>
                  ANNEX ENTRY
                </div>
                <p style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {result.annex_entry}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
