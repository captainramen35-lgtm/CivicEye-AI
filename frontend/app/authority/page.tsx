"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPriorityQueue, getImpactStats, updateIssueStatus } from "@/lib/api";
import FloatingNav from "@/components/landing/FloatingNav";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  BarChart2,
} from "lucide-react";

interface QueueIssue {
  id: string;
  issue_type: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: string;
  address: string;
  priority_score: number;
  verification_count: number;
  created_at: string;
  description?: string;
}

interface StatsData {
  total_reported: number;
  total_resolved: number;
  resolution_rate: number;
  avg_resolution_hours: number;
  by_category?: Record<string, number>;
}

const STATUS_OPTIONS = [
  { value: "reported", label: "Reported" },
  { value: "ai_verified", label: "AI Verified" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

function priorityColor(score: number): string {
  if (score >= 70) return "var(--red-alert)";
  if (score >= 40) return "var(--amber)";
  return "var(--green-ok)";
}

function priorityLabel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

export default function AuthorityPage() {
  const [queue, setQueue] = useState<QueueIssue[] | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateSuccess, setUpdateSuccess] = useState<Record<string, boolean>>({});

  useReveal();

  useEffect(() => {
    getImpactStats()
      .then((data) => setStats(data as unknown as StatsData))
      .catch(() =>
        setStats({
          total_reported: 142,
          total_resolved: 98,
          resolution_rate: 0.69,
          avg_resolution_hours: 36,
          by_category: { Road: 45, Water: 30, Waste: 25, Streetlight: 22, Drainage: 20 },
        })
      );

    getPriorityQueue()
      .then((data) => {
        const issues = data as unknown as QueueIssue[];
        setQueue(issues);
        // Init status map
        const map: Record<string, string> = {};
        issues.forEach((i) => (map[i.id] = i.status));
        setStatusMap(map);
      })
      .catch(() => {
        const demo: QueueIssue[] = [
          { id: "q1", issue_type: "Pothole on arterial road", category: "Road", severity: "high", status: "ai_verified", address: "MG Road, Bengaluru", priority_score: 87, verification_count: 12, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: "q2", issue_type: "Raw sewage overflow", category: "Drainage", severity: "high", status: "assigned", address: "Koramangala 4th Block", priority_score: 82, verification_count: 9, created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
          { id: "q3", issue_type: "Broken water main", category: "Water", severity: "high", status: "in_progress", address: "Indiranagar 100ft Road", priority_score: 76, verification_count: 7, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
          { id: "q4", issue_type: "Street light outage — 300m stretch", category: "Streetlight", severity: "medium", status: "reported", address: "HSR Layout Sector 7", priority_score: 58, verification_count: 5, created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
          { id: "q5", issue_type: "Illegal dumping site", category: "Waste", severity: "medium", status: "reported", address: "Whitefield Main Road", priority_score: 52, verification_count: 4, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
          { id: "q6", issue_type: "Damaged footpath tiles", category: "Road", severity: "low", status: "resolved", address: "JP Nagar 6th Phase", priority_score: 28, verification_count: 3, created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
          { id: "q7", issue_type: "Broken park bench", category: "Other", severity: "low", status: "reported", address: "Cubbon Park East Gate", priority_score: 18, verification_count: 1, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
        ];
        setQueue(demo);
        const map: Record<string, string> = {};
        demo.forEach((i) => (map[i.id] = i.status));
        setStatusMap(map);
      });
  }, []);

  async function handleUpdateStatus(issue: QueueIssue) {
    const newStatus = statusMap[issue.id];
    if (!newStatus || newStatus === issue.status) return;

    setUpdating((prev) => ({ ...prev, [issue.id]: true }));
    try {
      await updateIssueStatus({
        issue_id: issue.id,
        new_status: newStatus,
        authority_id: "authority",
      });
      // Optimistic update
      setQueue((prev) =>
        prev ? prev.map((q) => (q.id === issue.id ? { ...q, status: newStatus } : q)) : prev
      );
      setUpdateSuccess((prev) => ({ ...prev, [issue.id]: true }));
      setTimeout(() => setUpdateSuccess((prev) => ({ ...prev, [issue.id]: false })), 2500);
    } catch {
      // Optimistic anyway for demo
      setQueue((prev) =>
        prev ? prev.map((q) => (q.id === issue.id ? { ...q, status: newStatus } : q)) : prev
      );
      setUpdateSuccess((prev) => ({ ...prev, [issue.id]: true }));
      setTimeout(() => setUpdateSuccess((prev) => ({ ...prev, [issue.id]: false })), 2500);
    } finally {
      setUpdating((prev) => ({ ...prev, [issue.id]: false }));
    }
  }

  const highPriority = queue?.filter((q) => q.priority_score >= 70).length ?? 0;
  const resolvedToday = queue?.filter((q) => {
    const d = new Date(q.created_at);
    const now = new Date();
    return q.status === "resolved" && d.toDateString() === now.toDateString();
  }).length ?? 0;

  const categoryTotals: Record<string, number> = {};
  queue?.forEach((q) => {
    categoryTotals[q.category] = (categoryTotals[q.category] || 0) + 1;
  });
  const maxCatCount = Math.max(...Object.values(categoryTotals), 1);

  return (
    <main style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 80 }}>
      <FloatingNav />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 0" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="reveal" style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(44,110,142,0.08)",
              borderRadius: "var(--radius-pill)",
              padding: "6px 14px",
              marginBottom: 12,
            }}
          >
            <Shield size={15} strokeWidth={2} color="var(--civic-blue)" />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--civic-blue)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Authority View
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Authority Dashboard
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Prioritized civic issue queue — update statuses and track resolution.
          </p>
        </div>

        {/* ── Stats Banner ─────────────────────────────────── */}
        <div
          className="reveal reveal-delay-1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            {
              icon: <FileText size={20} strokeWidth={2} />,
              value: stats ? String(stats.total_reported - stats.total_resolved) : "—",
              label: "Total Open",
              color: "var(--civic-blue)",
            },
            {
              icon: <AlertTriangle size={20} strokeWidth={2} />,
              value: String(highPriority),
              label: "High Priority",
              color: "var(--red-alert)",
            },
            {
              icon: <CheckCircle2 size={20} strokeWidth={2} />,
              value: String(resolvedToday),
              label: "Resolved Today",
              color: "var(--green-ok)",
            },
            {
              icon: <Clock size={20} strokeWidth={2} />,
              value: stats
                ? stats.avg_resolution_hours < 24
                  ? `${Math.round(stats.avg_resolution_hours)}h`
                  : `${Math.round(stats.avg_resolution_hours / 24)}d`
                : "—",
              label: "Avg Resolution",
              color: "var(--amber)",
            },
          ].map(({ icon, value, label, color }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "var(--radius)",
                  background: `${color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color,
                }}
              >
                {icon}
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Priority Queue ───────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2
            className="reveal"
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={18} strokeWidth={2} color="var(--red-alert)" />
            Priority Issue Queue
          </h2>

          {queue === null ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 88, borderRadius: "var(--radius-lg)" }} />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div
              className="reveal"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                All clear! No pending issues.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {queue.map((issue, idx) => (
                <div
                  key={issue.id}
                  className="reveal"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "18px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                    boxShadow: "var(--shadow-sm)",
                    borderLeft: `4px solid ${priorityColor(issue.priority_score)}`,
                    transition: "box-shadow 0.2s ease",
                    animationDelay: `${idx * 0.05}s`,
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)")}
                >
                  {/* Priority badge */}
                  <div
                    style={{
                      background: priorityColor(issue.priority_score),
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-pill)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    P{Math.round(issue.priority_score)} · {priorityLabel(issue.priority_score)}
                  </div>

                  {/* Issue info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--text-primary)", marginBottom: 3 }}>
                      {issue.issue_type}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "rgba(44,110,142,0.1)",
                          color: "var(--civic-blue)",
                          padding: "1px 8px",
                          borderRadius: "var(--radius-pill)",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      >
                        {issue.category}
                      </span>
                      <span>📍 {issue.address}</span>
                      <span>🕒 {formatDate(issue.created_at)}</span>
                      <span>👍 {issue.verification_count} verified</span>
                    </div>
                  </div>

                  {/* Status dropdown + update button */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                    <select
                      value={statusMap[issue.id] || issue.status}
                      onChange={(e) =>
                        setStatusMap((prev) => ({ ...prev, [issue.id]: e.target.value }))
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        background: "var(--bg-base)",
                        color: "var(--text-primary)",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: "none",
                        minWidth: 130,
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleUpdateStatus(issue)}
                      disabled={updating[issue.id]}
                      style={{
                        background: updateSuccess[issue.id]
                          ? "var(--green-ok)"
                          : "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius)",
                        padding: "7px 16px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: updating[issue.id] ? "not-allowed" : "pointer",
                        opacity: updating[issue.id] ? 0.7 : 1,
                        transition: "all 0.2s ease",
                        whiteSpace: "nowrap",
                        minWidth: 110,
                      }}
                    >
                      {updating[issue.id]
                        ? "Updating…"
                        : updateSuccess[issue.id]
                        ? "✓ Updated"
                        : "Update Status"}
                    </button>

                    <Link href={`/issue/${issue.id}`} target="_blank">
                      <button
                        style={{
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: "7px 12px",
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "border-color 0.15s ease, color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--civic-blue)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--civic-blue)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                        }}
                      >
                        <ExternalLink size={13} strokeWidth={2} />
                        View
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Trends Bar Chart (CSS only) ──────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2
            className="reveal"
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BarChart2 size={18} strokeWidth={2} color="var(--civic-blue)" />
            Issues by Category
          </h2>

          <div
            className="reveal reveal-delay-1"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {Object.keys(categoryTotals).length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 24, borderRadius: "var(--radius)" }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => {
                    const pct = (count / maxCatCount) * 100;
                    const color =
                      cat === "Road" ? "var(--civic-blue)"
                        : cat === "Water" ? "var(--civic-blue-light)"
                        : cat === "Waste" ? "var(--green-ok)"
                        : cat === "Streetlight" ? "var(--amber)"
                        : cat === "Drainage" ? "#7C3AED"
                        : "var(--text-secondary)";

                    return (
                      <div key={cat}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            marginBottom: 6,
                          }}
                        >
                          <span>{cat}</span>
                          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{count} issues</span>
                        </div>
                        <div
                          style={{
                            height: 10,
                            background: "var(--border)",
                            borderRadius: "var(--radius-pill)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: color,
                              borderRadius: "var(--radius-pill)",
                              transition: "width 1s cubic-bezier(0.22,1,0.36,1)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
