"use client";
import { useState } from "react";
import { Source } from "@/app/page";

type Props = {
  sources?: Source[];
};

function extractArticle(text: string): string | null {
  const articleMatch = text.match(/Ar\s*ticle\s+(\d+)/i);
  if (articleMatch) return `Article ${articleMatch[1]}`;
  const recitalMatch = text.match(/Recital\s+(\d+)/i);
  if (recitalMatch) return `Recital ${recitalMatch[1]}`;
  if (/ANNEX\s+III/i.test(text)) return "Annex III";
  if (/ANNEX\s+I/i.test(text)) return "Annex I";
  return null;
}

const PDF_URL = "https://storage.googleapis.com/eu-ai-act-pdf/eu_ai_act.pdf"\;
const OFFSET = 1;

export default function SourcesPanel({ sources = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function handleClick(page: number, index: number) {
    setActiveIndex(index);
    window.open(`${PDF_URL}#page=${page + OFFSET}`, "_blank");
  }

  return (
    <div style={{
      width: 300,
      display: "flex",
      flexDirection: "column",
      background: "#0d1017",
      borderLeft: "0.5px solid #1e2530",
    }}>
      <div style={{
        padding: "14px 20px",
        borderBottom: "0.5px solid #1e2530",
      }}>
        <div style={{
          fontSize: 10,
          color: "#475569",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.08em",
        }}>
          RETRIEVED SOURCES
        </div>
        <div style={{
          fontSize: 10,
          color: "#334155",
          fontFamily: "'DM Mono', monospace",
          marginTop: 3,
        }}>
          {sources.length > 0 ? `${sources.length} chunks · click to open` : "awaiting query"}
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {sources.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: 8,
            marginTop: 60,
          }}>
            <div style={{
              width: 32, height: 32,
              border: "0.5px solid #1e2530",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, color: "#1e2530" }}>⊘</span>
            </div>
            <p style={{ fontSize: 10, color: "#1e2530", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
              sources will appear<br />after your first query
            </p>
          </div>
        ) : (
          sources.map((source, i) => {
            const article = extractArticle(source.text);
            const isActive = activeIndex === i;
            return (
              <div
                key={i}
                onClick={() => handleClick(source.page, i)}
                style={{
                  background: isActive ? "#0f1e35" : "#111827",
                  border: `0.5px solid ${isActive ? "#3b82f6" : "#1e2530"}`,
                  borderRadius: 8,
                  padding: 12,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "#2d4a6e";
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "#1e2530";
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 7,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      color: "#3b82f6",
                      background: "#0f1e35",
                      border: "0.5px solid #1d3461",
                      padding: "2px 8px",
                      borderRadius: 4,
                    }}>
                      pg. {source.page}
                    </span>
                    {article && (
                      <span style={{
                        fontSize: 10,
                        color: "#475569",
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {article}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 10,
                    color: isActive ? "#60a5fa" : "#334155",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    open ↗
                  </span>
                </div>
                <p style={{
                  fontSize: 11,
                  color: isActive ? "#64748b" : "#334155",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {source.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
