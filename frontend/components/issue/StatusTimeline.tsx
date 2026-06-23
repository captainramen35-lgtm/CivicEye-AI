"use client";

import { Check } from "lucide-react";

export interface StatusHistoryItem {
  status: string;
  timestamp: string;
  actor?: string;
  note?: string;
}

interface StatusTimelineProps {
  statusHistory: StatusHistoryItem[];
  currentStatus: string;
}

const STAGES = [
  { key: "reported",    label: "Reported" },
  { key: "ai_verified", label: "AI Verified" },
  { key: "assigned",   label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved",   label: "Resolved" },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function getStageIndex(status: string): number {
  return STAGES.findIndex((s) => s.key === status);
}

export default function StatusTimeline({
  statusHistory,
  currentStatus,
}: StatusTimelineProps) {
  const currentIdx = getStageIndex(currentStatus);

  // build a lookup: status key → history entry
  const historyMap: Record<string, StatusHistoryItem> = {};
  statusHistory.forEach((h) => {
    historyMap[h.status] = h;
  });

  const progressPct =
    currentIdx <= 0
      ? 0
      : Math.round((currentIdx / (STAGES.length - 1)) * 100);

  return (
    <div style={{ position: "relative" }}>
      {/* Vertical connector line */}
      <div
        style={{
          position: "absolute",
          left: 19,
          top: 28,
          bottom: 28,
          width: 2,
          background: `linear-gradient(to bottom, var(--civic-blue) ${progressPct}%, var(--border) ${progressPct}%)`,
          borderRadius: 9999,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isFuture = idx > currentIdx;
          const histEntry = historyMap[stage.key];

          return (
            <div
              key={stage.key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                paddingBottom: idx < STAGES.length - 1 ? 28 : 0,
                position: "relative",
              }}
            >
              {/* Circle indicator */}
              <div style={{ position: "relative", flexShrink: 0, zIndex: 1 }}>
                {isCompleted && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(44,110,142,0.35)",
                    }}
                  >
                    <Check size={18} strokeWidth={2.5} color="white" />
                  </div>
                )}

                {isCurrent && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--civic-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "timelinePulse 2s ease infinite",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "white",
                      }}
                    />
                  </div>
                )}

                {isFuture && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--bg-base)",
                      border: "2px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "var(--border)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                <p
                  style={{
                    fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                    fontSize: "0.95rem",
                    color: isFuture
                      ? "var(--text-muted)"
                      : isCurrent
                      ? "var(--civic-blue)"
                      : "var(--text-primary)",
                    marginBottom: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {stage.label}
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        background: "rgba(44,110,142,0.1)",
                        color: "var(--civic-blue)",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                      }}
                    >
                      CURRENT
                    </span>
                  )}
                </p>

                {histEntry && (
                  <div style={{ marginTop: 2 }}>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginBottom: 2,
                      }}
                    >
                      {formatDate(histEntry.timestamp)}
                      {histEntry.actor && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: "var(--text-secondary)",
                            fontWeight: 500,
                          }}
                        >
                          · {histEntry.actor}
                        </span>
                      )}
                    </p>
                    {histEntry.note && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          fontStyle: "italic",
                          marginTop: 2,
                          lineHeight: 1.4,
                        }}
                      >
                        &ldquo;{histEntry.note}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {isFuture && (
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Pending
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes timelinePulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(44,110,142,0.18), 0 2px 8px rgba(44,110,142,0.35); }
          50%       { box-shadow: 0 0 0 12px rgba(44,110,142,0.05), 0 2px 8px rgba(44,110,142,0.25); }
        }
      `}</style>
    </div>
  );
}
