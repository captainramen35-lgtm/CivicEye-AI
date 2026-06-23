"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

interface TrustScoreBarProps {
  score: number; // 0–1
  verificationCount: number;
}

export default function TrustScoreBar({ score, verificationCount }: TrustScoreBarProps) {
  const [animated, setAnimated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (barRef.current) observer.observe(barRef.current);
    return () => observer.disconnect();
  }, []);

  const pct = Math.round(score * 100);

  const barColor =
    score >= 0.7
      ? "var(--green-ok)"
      : score >= 0.4
      ? "var(--amber)"
      : "var(--red-alert)";

  const label =
    score >= 0.7 ? "Trusted" : score >= 0.4 ? "Building Trust" : "Low Trust";

  const labelColor =
    score >= 0.7
      ? "var(--green-ok)"
      : score >= 0.4
      ? "var(--amber)"
      : "var(--red-alert)";

  return (
    <div ref={barRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: labelColor,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {pct}%
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: labelColor,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Trust Score
            </span>
          </div>
        </div>

        {/* Tooltip trigger */}
        <div style={{ position: "relative" }}>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              padding: 4,
            }}
            aria-label="Trust score info"
          >
            <Info size={16} strokeWidth={2} />
          </button>

          {showTooltip && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 240,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                boxShadow: "var(--shadow-md)",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                zIndex: 20,
              }}
            >
              Trust score is based on how often your verifications match issue resolutions by authorities.
            </div>
          )}
        </div>
      </div>

      {/* Bar track */}
      <div
        style={{
          height: 10,
          background: "var(--border)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
        }}
      >
        {/* Filled portion */}
        <div
          className="trust-bar-fill"
          style={{
            height: "100%",
            width: animated ? `${pct}%` : "0%",
            background:
              score >= 0.7
                ? "linear-gradient(90deg, var(--civic-blue), var(--green-ok))"
                : score >= 0.4
                ? "linear-gradient(90deg, var(--amber), #f5c567)"
                : "linear-gradient(90deg, var(--red-alert), #e97c7c)",
          }}
        />
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {verificationCount}
        </span>{" "}
        verifications made
      </div>
    </div>
  );
}
