"use client";

import { Brain, AlertTriangle, Building2, Tag, Gauge } from "lucide-react";

export interface AIResult {
  issue_type: string;
  severity: "low" | "medium" | "high";
  risk_notes: string;
  department: string;
  category: string;
  confidence: number;
}

interface AIAnalysisPreviewProps {
  result: AIResult;
  onUpdate: (field: keyof AIResult, value: string) => void;
}

const SEVERITY_OPTIONS: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];

const CATEGORY_OPTIONS = [
  "Infrastructure",
  "Sanitation",
  "Public Safety",
  "Environment",
  "Roads & Pavements",
  "Street Lighting",
  "Drainage & Flooding",
  "Public Property",
  "Traffic & Signage",
  "Parks & Recreation",
  "Water Supply",
  "Noise Pollution",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "Public Works",
  "Municipal Corporation",
  "Roads Department",
  "Water & Sanitation",
  "Parks & Gardens",
  "Traffic Police",
  "Environment Department",
  "Electricity Board",
  "Drainage Department",
  "Health Department",
  "Other",
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "var(--green-ok)",
  medium: "var(--amber)",
  high: "var(--red-alert)",
};

const CONFIDENCE_COLOR = (score: number) => {
  if (score >= 0.75) return "var(--green-ok)";
  if (score >= 0.5) return "var(--amber)";
  return "var(--red-alert)";
};

// Shared label style
const labelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--text-muted)",
  marginBottom: 6,
  display: "block",
};

// Shared input style
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: "var(--radius)",
  border: "1.5px solid var(--border)",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  fontSize: "0.875rem",
  fontFamily: "inherit",
  fontWeight: 500,
  outline: "none",
  transition: "border-color 0.15s ease",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 36,
};

export default function AIAnalysisPreview({ result, onUpdate }: AIAnalysisPreviewProps) {
  const confidencePct = Math.round(result.confidence * 100);
  const confColor = CONFIDENCE_COLOR(result.confidence);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 20px",
          background: "linear-gradient(135deg, rgba(44,110,142,0.06) 0%, rgba(61,140,175,0.04) 100%)",
          borderBottom: "1.5px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Brain size={18} strokeWidth={2} color="white" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            AI Classification
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Please verify and adjust if needed
          </p>
        </div>

        {/* Confidence badge on the right */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: "var(--radius-pill)",
              background: `rgba(${confColor === "var(--green-ok)" ? "62,156,107" : confColor === "var(--amber)" ? "224,162,59" : "209,69,69"},0.12)`,
              border: `1px solid ${confColor}40`,
              fontSize: "0.8rem",
              fontWeight: 700,
              color: confColor,
            }}
          >
            <Gauge size={12} strokeWidth={2} />
            {confidencePct}% confidence
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "20px" }}>
        {/* Confidence bar */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              AI Confidence Score
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: confColor,
              }}
            >
              {confidencePct}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--border)",
              borderRadius: "var(--radius-pill)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${confidencePct}%`,
                background:
                  confColor === "var(--green-ok)"
                    ? "linear-gradient(90deg, var(--civic-blue), var(--green-ok))"
                    : confColor === "var(--amber)"
                    ? "linear-gradient(90deg, var(--amber), #f59e0b)"
                    : "linear-gradient(90deg, var(--red-alert), #ef4444)",
                borderRadius: "var(--radius-pill)",
                transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
          {result.confidence < 0.6 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                padding: "8px 12px",
                borderRadius: "var(--radius)",
                background: "rgba(224,162,59,0.08)",
                border: "1px solid rgba(224,162,59,0.25)",
              }}
            >
              <AlertTriangle size={13} strokeWidth={2} color="var(--amber)" />
              <span style={{ fontSize: "0.75rem", color: "#9A6B1A", fontWeight: 500 }}>
                Low confidence — please review all fields carefully
              </span>
            </div>
          )}
        </div>

        {/* Fields grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* Issue Type */}
          <div>
            <label htmlFor="ai-issue-type" style={labelStyle}>
              Issue Type
            </label>
            <input
              id="ai-issue-type"
              type="text"
              value={result.issue_type}
              onChange={(e) => onUpdate("issue_type", e.target.value)}
              style={inputStyle}
              placeholder="e.g. Pothole, Broken streetlight…"
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderColor = "var(--civic-blue)")
              }
              onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--border)")}
            />
          </div>

          {/* Severity */}
          <div>
            <label htmlFor="ai-severity" style={labelStyle}>
              Severity
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="ai-severity"
                value={result.severity}
                onChange={(e) =>
                  onUpdate("severity", e.target.value as "low" | "medium" | "high")
                }
                style={{
                  ...selectStyle,
                  color: SEVERITY_COLORS[result.severity],
                  fontWeight: 700,
                }}
                onFocus={(e) =>
                  ((e.target as HTMLSelectElement).style.borderColor = "var(--civic-blue)")
                }
                onBlur={(e) =>
                  ((e.target as HTMLSelectElement).style.borderColor = "var(--border)")
                }
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s} style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              {/* Severity indicator dot */}
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "none", // hidden; colour conveyed by text
                }}
              />
            </div>
            {/* Severity badge */}
            <div style={{ marginTop: 6 }}>
              <span
                className={`badge-${result.severity}`}
                style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {result.severity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="ai-category" style={labelStyle}>
              <Tag size={11} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
              Category
            </label>
            <select
              id="ai-category"
              value={result.category}
              onChange={(e) => onUpdate("category", e.target.value)}
              style={selectStyle}
              onFocus={(e) =>
                ((e.target as HTMLSelectElement).style.borderColor = "var(--civic-blue)")
              }
              onBlur={(e) =>
                ((e.target as HTMLSelectElement).style.borderColor = "var(--border)")
              }
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {/* Allow the AI value even if it's not in our list */}
              {!CATEGORY_OPTIONS.includes(result.category) && (
                <option value={result.category}>{result.category}</option>
              )}
            </select>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="ai-department" style={labelStyle}>
              <Building2 size={11} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
              Department
            </label>
            <select
              id="ai-department"
              value={result.department}
              onChange={(e) => onUpdate("department", e.target.value)}
              style={selectStyle}
              onFocus={(e) =>
                ((e.target as HTMLSelectElement).style.borderColor = "var(--civic-blue)")
              }
              onBlur={(e) =>
                ((e.target as HTMLSelectElement).style.borderColor = "var(--border)")
              }
            >
              {DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              {!DEPARTMENT_OPTIONS.includes(result.department) && (
                <option value={result.department}>{result.department}</option>
              )}
            </select>
          </div>
        </div>

        {/* Risk Notes — full width */}
        <div style={{ marginTop: 16 }}>
          <label htmlFor="ai-risk-notes" style={labelStyle}>
            <AlertTriangle size={11} strokeWidth={2} style={{ display: "inline", marginRight: 4 }} />
            Risk Notes
          </label>
          <textarea
            id="ai-risk-notes"
            value={result.risk_notes}
            onChange={(e) => onUpdate("risk_notes", e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 80,
              lineHeight: 1.6,
            }}
            placeholder="Describe any hazards or safety concerns…"
            onFocus={(e) =>
              ((e.target as HTMLTextAreaElement).style.borderColor = "var(--civic-blue)")
            }
            onBlur={(e) =>
              ((e.target as HTMLTextAreaElement).style.borderColor = "var(--border)")
            }
          />
        </div>

        {/* Footer note */}
        <p
          style={{
            marginTop: 14,
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Brain size={11} strokeWidth={2} />
          Powered by Gemini Vision · All fields are editable before submission
        </p>
      </div>
    </div>
  );
}
