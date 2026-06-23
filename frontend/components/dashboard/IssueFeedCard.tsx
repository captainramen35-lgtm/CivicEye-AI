"use client";

import Link from "next/link";
import { ThumbsUp, MapPin, ArrowRight } from "lucide-react";

export interface Issue {
  id: string;
  photo_url?: string;
  issue_type: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: "reported" | "ai_verified" | "assigned" | "in_progress" | "resolved";
  address: string;
  priority_score: number;
  verification_count: number;
  distance_m?: number;
  created_at: string;
}

interface IssueFeedCardProps {
  issue: Issue | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Road: "rgba(44,110,142,0.12)",
  Water: "rgba(61,140,175,0.12)",
  Waste: "rgba(62,156,107,0.12)",
  Streetlight: "rgba(224,162,59,0.12)",
  Drainage: "rgba(139,92,246,0.12)",
  Other: "rgba(100,116,139,0.12)",
};

const CATEGORY_TEXT: Record<string, string> = {
  Road: "var(--civic-blue-dark)",
  Water: "var(--civic-blue)",
  Waste: "var(--green-ok)",
  Streetlight: "#92651A",
  Drainage: "#5B21B6",
  Other: "var(--text-secondary)",
};

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m away`;
  return `${(m / 1000).toFixed(1)} km away`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function priorityColor(score: number): string {
  if (score >= 70) return "var(--red-alert)";
  if (score >= 40) return "var(--amber)";
  return "var(--green-ok)";
}

// Skeleton variant
function IssueFeedCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "var(--radius)", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton" style={{ width: "40%", height: 18, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ width: "70%", height: 20, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ width: "90%", height: 14, borderRadius: "var(--radius)" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: "var(--radius-pill)" }} />
          <div className="skeleton" style={{ width: 80, height: 22, borderRadius: "var(--radius-pill)" }} />
        </div>
      </div>
    </div>
  );
}

export default function IssueFeedCard({ issue }: IssueFeedCardProps) {
  if (!issue) return <IssueFeedCardSkeleton />;

  const catBg = CATEGORY_COLORS[issue.category] || CATEGORY_COLORS.Other;
  const catText = CATEGORY_TEXT[issue.category] || CATEGORY_TEXT.Other;

  return (
    <div
      className="reveal"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "16px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--civic-blue)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Priority score pill (top-right) */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: priorityColor(issue.priority_score),
          color: "white",
          fontSize: "0.7rem",
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "var(--radius-pill)",
          letterSpacing: "0.02em",
        }}
      >
        P{Math.round(issue.priority_score)}
      </div>

      {/* Thumbnail */}
      {issue.photo_url ? (
        <img
          src={issue.photo_url}
          alt={issue.issue_type}
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: "var(--radius)",
            flexShrink: 0,
            background: "var(--border)",
          }}
        />
      ) : (
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius)",
            background: catBg,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          {issue.category === "Road" ? "🛣️"
            : issue.category === "Water" ? "💧"
            : issue.category === "Waste" ? "🗑️"
            : issue.category === "Streetlight" ? "💡"
            : issue.category === "Drainage" ? "🌊"
            : "📍"}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Category tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: catBg,
            color: catText,
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "2px 10px",
            borderRadius: "var(--radius-pill)",
            width: "fit-content",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {issue.category}
        </div>

        {/* Issue type */}
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.92rem",
            color: "var(--text-primary)",
            lineHeight: 1.3,
            marginRight: 40,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {issue.issue_type}
        </div>

        {/* Address */}
        <div
          style={{
            fontSize: "0.78rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <MapPin size={11} strokeWidth={2} />
          {issue.address}
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span
            className={`badge-${issue.severity}`}
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: "var(--radius-pill)",
              textTransform: "capitalize",
            }}
          >
            {issue.severity}
          </span>
          <span
            className={`badge-${issue.status}`}
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "2px 10px",
              borderRadius: "var(--radius-pill)",
              textTransform: "capitalize",
              background:
                issue.status === "reported"
                  ? "rgba(100,116,139,0.1)"
                  : issue.status === "ai_verified"
                  ? "rgba(44,110,142,0.1)"
                  : issue.status === "assigned"
                  ? "rgba(224,162,59,0.1)"
                  : issue.status === "in_progress"
                  ? "rgba(139,92,246,0.1)"
                  : "rgba(62,156,107,0.1)",
            }}
          >
            {issue.status.replace("_", " ")}
          </span>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Verification count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              <ThumbsUp size={12} strokeWidth={2} />
              {issue.verification_count}
            </div>

            {/* Distance */}
            {issue.distance_m != null && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                📍 {formatDistance(issue.distance_m)}
              </div>
            )}

            {/* Time */}
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {formatDate(issue.created_at)}
            </div>
          </div>

          {/* View Details link */}
          <Link
            href={`/issues/${issue.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--civic-blue)",
              textDecoration: "none",
              transition: "gap 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.gap = "6px";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.gap = "4px";
            }}
          >
            View Details
            <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
