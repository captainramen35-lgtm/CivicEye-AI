"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { getLeaderboard } from "@/lib/api";
import FloatingNav from "@/components/landing/FloatingNav";
import { Trophy, Crown, Medal } from "lucide-react";

interface LeaderboardEntry {
  uid: string;
  displayName?: string;
  name?: string;
  badge_level?: string;
  report_count?: number;
  verification_count?: number;
  contributions?: number;
  trust_score?: number;
  created_at?: string;
}

type FilterTab = "all_time" | "this_month";

function getInitials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function contributions(entry: LeaderboardEntry): number {
  return (
    entry.contributions ??
    (entry.report_count ?? 0) + (entry.verification_count ?? 0)
  );
}

const PODIUM_COLORS = [
  // 1st
  {
    bg: "linear-gradient(135deg, #F6D860 0%, #F0C020 100%)",
    border: "#F0C020",
    text: "#7A5E00",
    height: 90,
  },
  // 2nd
  {
    bg: "linear-gradient(135deg, #D0D8E4 0%, #B0BCCC 100%)",
    border: "#B0BCCC",
    text: "#3E4C5E",
    height: 64,
  },
  // 3rd
  {
    bg: "linear-gradient(135deg, #E8C49A 0%, #D4A570 100%)",
    border: "#D4A570",
    text: "#6B3E1A",
    height: 48,
  },
];

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[] | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all_time");

  useReveal();

  useEffect(() => {
    getLeaderboard()
      .then((res) => setData(res as unknown as LeaderboardEntry[]))
      .catch(() => {
        // Demo fallback
        setData([
          { uid: "u1", displayName: "Priya Sharma", badge_level: "city_guardian", report_count: 87, verification_count: 142, trust_score: 0.94, created_at: "2025-01-01" },
          { uid: "u2", displayName: "Rohan Mehta", badge_level: "community_hero", report_count: 65, verification_count: 110, trust_score: 0.88, created_at: "2025-02-10" },
          { uid: "u3", displayName: "Ananya Reddy", badge_level: "community_hero", report_count: 59, verification_count: 95, trust_score: 0.81, created_at: "2025-01-20" },
          { uid: "u4", displayName: "Vikram Nair", badge_level: "civic_contributor", report_count: 44, verification_count: 78, trust_score: 0.75, created_at: "2025-03-01" },
          { uid: "u5", displayName: "Sneha Gupta", badge_level: "civic_contributor", report_count: 38, verification_count: 60, trust_score: 0.72, created_at: "2025-03-15" },
          { uid: "u6", displayName: "Karthik Iyer", badge_level: "community_reporter", report_count: 28, verification_count: 44, trust_score: 0.65, created_at: "2025-04-01" },
          { uid: "u7", displayName: "Deepa Pillai", badge_level: "community_reporter", report_count: 22, verification_count: 35, trust_score: 0.61, created_at: "2025-04-10" },
          { uid: "u8", displayName: "Arjun Singh", badge_level: "community_reporter", report_count: 15, verification_count: 22, trust_score: 0.55, created_at: "2025-05-01" },
        ]);
      });
  }, []);

  // Filter — if "this_month", simulate by showing only entries from the last 30 days
  // With demo data we'll just show top 5 as a "this month" filter
  const filteredData = data
    ? activeTab === "this_month"
      ? data.slice(0, 5)
      : data
    : null;

  const top3 = filteredData?.slice(0, 3) ?? [];
  const rest = filteredData?.slice(3) ?? [];

  // Find current user rank
  const myRank = filteredData
    ? filteredData.findIndex((e) => e.uid === user?.uid)
    : -1;

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd visual order

  return (
    <main style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 80 }}>
      <FloatingNav />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 24px 0" }}>

        {/* ── Top Banner ───────────────────────────────────── */}
        <div
          className="reveal"
          style={{
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--amber), #f5c567)",
              marginBottom: 16,
              boxShadow: "0 8px 24px rgba(224,162,59,0.35)",
            }}
          >
            <Trophy size={28} strokeWidth={2} color="white" />
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            Civic Hero <span style={{ color: "var(--civic-blue)" }}>Rankings</span>
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Citizens making the biggest difference in their communities.
          </p>
        </div>

        {/* ── Filter Tabs ──────────────────────────────────── */}
        <div
          className="reveal reveal-delay-1"
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 36,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "4px",
            width: "fit-content",
          }}
        >
          {(["all_time", "this_month"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 22px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                background:
                  activeTab === tab
                    ? "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))"
                    : "transparent",
                color: activeTab === tab ? "white" : "var(--text-secondary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab === "all_time" ? "All Time" : "This Month"}
            </button>
          ))}
        </div>

        {/* ── Loading ──────────────────────────────────────── */}
        {data === null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 68, borderRadius: "var(--radius-lg)" }}
              />
            ))}
          </div>
        )}

        {/* ── Empty State ──────────────────────────────────── */}
        {filteredData !== null && filteredData.length === 0 && (
          <div
            className="reveal"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "60px 24px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏜️</div>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
              No rankings yet.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Be the first to report a civic issue and claim your spot!
            </p>
          </div>
        )}

        {/* ── Podium ───────────────────────────────────────── */}
        {filteredData !== null && filteredData.length > 0 && (
          <>
            <div
              className="reveal"
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 12,
                marginBottom: 40,
              }}
            >
              {podiumOrder.map((entry, visualIdx) => {
                if (!entry) return <div key={visualIdx} style={{ flex: 1 }} />;
                const actualRank = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2; // map visual to rank (1st center)
                const realRank = actualRank; // rank index in data
                const config = PODIUM_COLORS[realRank];
                const rankNum = realRank + 1;
                const isFirst = rankNum === 1;
                const CrownIcon = rankNum === 1 ? Crown : rankNum === 2 ? Medal : Medal;
                const crownColor = rankNum === 1 ? "#F0C020" : rankNum === 2 ? "#B0BCCC" : "#D4A570";

                return (
                  <div
                    key={entry.uid}
                    style={{
                      flex: 1,
                      maxWidth: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {/* Crown */}
                    <div style={{ color: crownColor, marginBottom: 2 }}>
                      <CrownIcon size={isFirst ? 28 : 20} strokeWidth={2} />
                    </div>

                    {/* Avatar */}
                    <div
                      style={{
                        width: isFirst ? 72 : 56,
                        height: isFirst ? 72 : 56,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 800,
                        fontSize: isFirst ? "1.4rem" : "1rem",
                        border: `3px solid ${config.border}`,
                        boxShadow: isFirst ? "var(--shadow-md)" : "var(--shadow-sm)",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(entry.displayName || entry.name)}
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: isFirst ? "0.95rem" : "0.82rem",
                        color: "var(--text-primary)",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {entry.displayName || entry.name || "Anonymous"}
                    </div>

                    {/* Score */}
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      {contributions(entry)} contributions
                    </div>

                    {/* Podium block */}
                    <div
                      style={{
                        width: "100%",
                        height: config.height,
                        background: config.bg,
                        borderRadius: "var(--radius) var(--radius) 0 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: isFirst ? "1.8rem" : "1.4rem",
                        color: config.text,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      #{rankNum}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Ranked List ──────────────────────────────────── */}
            <div
              className="reveal"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                marginBottom: 28,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr 120px 80px",
                  padding: "12px 20px",
                  background: "var(--bg-base)",
                  borderBottom: "1px solid var(--border)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  gap: 12,
                }}
              >
                <span>Rank</span>
                <span>Citizen</span>
                <span style={{ textAlign: "right" }}>Contributions</span>
                <span style={{ textAlign: "right" }}>Trust</span>
              </div>

              {filteredData.map((entry, idx) => {
                const isMe = entry.uid === user?.uid;
                const rank = idx + 1;

                return (
                  <div
                    key={entry.uid}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "48px 1fr 120px 80px",
                      padding: "14px 20px",
                      gap: 12,
                      alignItems: "center",
                      borderBottom: idx < filteredData.length - 1 ? "1px solid var(--border)" : "none",
                      background: isMe
                        ? "rgba(44,110,142,0.06)"
                        : "transparent",
                      borderLeft: isMe ? "3px solid var(--civic-blue)" : "3px solid transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isMe) (e.currentTarget as HTMLDivElement).style.background = "var(--bg-base)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isMe) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    {/* Rank number */}
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: rank <= 3 ? "1rem" : "0.88rem",
                        color:
                          rank === 1
                            ? "#C9A800"
                            : rank === 2
                            ? "#8096AA"
                            : rank === 3
                            ? "#AA7D40"
                            : "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
                    </div>

                    {/* Avatar + name + badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(entry.displayName || entry.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            color: isMe ? "var(--civic-blue)" : "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entry.displayName || entry.name || "Anonymous"}
                          {isMe && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: "var(--civic-blue)",
                                color: "white",
                                padding: "1px 6px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            textTransform: "capitalize",
                          }}
                        >
                          {(entry.badge_level || "newcomer").replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>

                    {/* Contributions */}
                    <div
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {contributions(entry)}
                    </div>

                    {/* Trust score */}
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color:
                            (entry.trust_score ?? 0) >= 0.7
                              ? "var(--green-ok)"
                              : (entry.trust_score ?? 0) >= 0.4
                              ? "var(--amber)"
                              : "var(--red-alert)",
                        }}
                      >
                        {Math.round((entry.trust_score ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* My rank callout (if not in visible list) */}
            {myRank >= 0 && !filteredData.find((e) => e.uid === user?.uid) && (
              <div
                className="reveal"
                style={{
                  background: "rgba(44,110,142,0.06)",
                  border: "1px solid var(--civic-blue)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 20px",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  color: "var(--civic-blue)",
                  fontWeight: 600,
                }}
              >
                Your rank: #{myRank + 1} — Keep contributing to climb higher! 🚀
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
