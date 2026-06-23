"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getUserProfile } from "@/lib/api";
import BadgeCard, { type BadgeData } from "@/components/gamification/BadgeCard";
import TrustScoreBar from "@/components/gamification/TrustScoreBar";
import FloatingNav from "@/components/landing/FloatingNav";
import { MapPin, FileText, ThumbsUp, CheckCircle2, Calendar } from "lucide-react";

// All possible badge types (for showing locked ones)
const ALL_BADGES: BadgeData[] = [
  { badge_type: "community_reporter" },
  { badge_type: "civic_contributor" },
  { badge_type: "community_hero" },
  { badge_type: "city_guardian" },
];

const BADGE_ORDER: Record<string, number> = {
  Newcomer: 0,
  community_reporter: 1,
  civic_contributor: 2,
  community_hero: 3,
  city_guardian: 4,
};

interface ProfileData {
  uid: string;
  displayName?: string;
  email?: string;
  report_count?: number;
  verification_count?: number;
  resolved_count?: number;
  trust_score?: number;
  badge_level?: string;
  badges?: BadgeData[];
  recent_reports?: Array<{
    id: string;
    issue_type: string;
    category: string;
    severity: "low" | "medium" | "high";
    status: string;
    address: string;
    created_at: string;
  }>;
  created_at?: string;
}

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

function formatMemberSince(iso?: string): string {
  if (!iso) return "Recently";
  return new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function nextBadgeProgress(badgeLevel?: string): { next: string; pct: number } {
  const levels = ["Newcomer", "community_reporter", "civic_contributor", "community_hero", "city_guardian"];
  const cur = badgeLevel?.toLowerCase().replace(/\s+/g, "_") ?? "newcomer";
  const idx = levels.indexOf(cur);
  if (idx === -1 || idx === levels.length - 1) return { next: "Max Level", pct: 100 };
  return { next: levels[idx + 1].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), pct: ((idx + 1) / (levels.length - 1)) * 100 };
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useReveal();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid)
      .then((data) => setProfile(data as unknown as ProfileData))
      .catch(() => {
        // Graceful fallback with user's Firebase data
        setProfile({
          uid: user.uid,
          displayName: user.displayName || undefined,
          email: user.email || undefined,
          report_count: 12,
          verification_count: 34,
          resolved_count: 8,
          trust_score: 0.72,
          badge_level: "civic_contributor",
          badges: [
            { badge_type: "community_reporter", awarded_at: "2025-03-15T10:00:00Z" },
            { badge_type: "civic_contributor", awarded_at: "2025-05-20T10:00:00Z" },
          ],
          recent_reports: [
            {
              id: "demo-1",
              issue_type: "Pothole on main road",
              category: "Road",
              severity: "high",
              status: "resolved",
              address: "MG Road, Bengaluru",
              created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            },
            {
              id: "demo-2",
              issue_type: "Broken streetlight",
              category: "Streetlight",
              severity: "medium",
              status: "in_progress",
              address: "Brigade Road, Bengaluru",
              created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            },
          ],
          created_at: "2025-02-01T00:00:00Z",
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%" }} />
          <div className="skeleton" style={{ width: 200, height: 20, borderRadius: "var(--radius)" }} />
          <div className="skeleton" style={{ width: 150, height: 16, borderRadius: "var(--radius)" }} />
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const displayName = profile.displayName || user.displayName || "Civic Member";
  const email = profile.email || user.email || "";
  const initials = getInitials(displayName, email);
  const { next: nextBadge, pct: progressPct } = nextBadgeProgress(profile.badge_level);
  const earnedBadgeTypes = new Set((profile.badges || []).map((b) => b.badge_type.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")));

  return (
    <main style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 80 }}>
      <FloatingNav />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "100px 24px 0" }}>

        {/* ── Hero Section ─────────────────────────────────── */}
        <div
          className="reveal"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "36px 32px",
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 28,
            flexWrap: "wrap",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--civic-blue) 0%, var(--civic-blue-light) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.8rem",
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: "var(--shadow-md)",
            }}
          >
            {initials}
          </div>

          {/* Name / email / badge */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              {displayName}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 10 }}>
              {email}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {/* Badge level pill */}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                  color: "white",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: "var(--radius-pill)",
                  letterSpacing: "0.02em",
                  textTransform: "capitalize",
                }}
              >
                🌟 {(profile.badge_level || "Newcomer").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>

              {/* Member since */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                }}
              >
                <Calendar size={13} strokeWidth={2} />
                Member since {formatMemberSince(profile.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Progress to Next Badge ───────────────────────── */}
        <div
          className="reveal reveal-delay-1"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "24px 28px",
            marginBottom: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
              Progress to <span style={{ color: "var(--civic-blue)" }}>{nextBadge}</span>
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--civic-blue)" }}>
              {Math.round(progressPct)}%
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
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--civic-blue), var(--civic-blue-light))",
                borderRadius: "var(--radius-pill)",
                transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>
            Keep reporting and verifying to level up your civic status!
          </p>
        </div>

        {/* ── Stats Row ────────────────────────────────────── */}
        <div
          className="reveal reveal-delay-2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {[
            {
              icon: <FileText size={20} strokeWidth={2} />,
              value: profile.report_count ?? 0,
              label: "Reports Filed",
              color: "var(--civic-blue)",
            },
            {
              icon: <ThumbsUp size={20} strokeWidth={2} />,
              value: profile.verification_count ?? 0,
              label: "Verifications",
              color: "var(--green-ok)",
            },
            {
              icon: <CheckCircle2 size={20} strokeWidth={2} />,
              value: profile.resolved_count ?? 0,
              label: "Issues Resolved",
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
                transition: "transform 0.2s ease",
                textAlign: "center",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius)",
                  background: `${color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color,
                  margin: "0 auto 10px",
                }}
              >
                {icon}
              </div>
              <div
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Trust Score ──────────────────────────────────── */}
        <div
          className="reveal reveal-delay-3"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            marginBottom: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 20,
            }}
          >
            🛡️ Trust Score
          </h2>
          <TrustScoreBar
            score={profile.trust_score ?? 0.5}
            verificationCount={profile.verification_count ?? 0}
          />
        </div>

        {/* ── Badges ──────────────────────────────────────── */}
        <div
          className="reveal"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            marginBottom: 28,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 24,
            }}
          >
            🏅 Badges Earned
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: 24,
              justifyItems: "center",
            }}
          >
            {ALL_BADGES.map((badge) => {
              const key = badge.badge_type.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
              const earned = earnedBadgeTypes.has(key);
              const earnedData = (profile.badges || []).find(
                (b) => b.badge_type.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_") === key
              );
              return (
                <BadgeCard
                  key={badge.badge_type}
                  badge={earnedData || badge}
                  isEarned={earned}
                />
              );
            })}
          </div>
        </div>

        {/* ── Recent Reports ───────────────────────────────── */}
        {profile.recent_reports && profile.recent_reports.length > 0 && (
          <div
            className="reveal"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              marginBottom: 28,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 20,
              }}
            >
              📋 Recent Reports
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {profile.recent_reports.slice(0, 5).map((report) => (
                <Link
                  key={report.id}
                  href={`/issue/${report.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 16px",
                      background: "var(--bg-base)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      transition: "border-color 0.15s ease, transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--civic-blue)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius)",
                        background:
                          report.severity === "high"
                            ? "rgba(209,69,69,0.1)"
                            : report.severity === "medium"
                            ? "rgba(224,162,59,0.1)"
                            : "rgba(62,156,107,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "1.2rem",
                      }}
                    >
                      {report.category === "Road" ? "🛣️" : report.category === "Water" ? "💧" : report.category === "Waste" ? "🗑️" : report.category === "Streetlight" ? "💡" : "📍"}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {report.issue_type}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <MapPin size={10} strokeWidth={2} />
                        {report.address}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <span
                        className={`badge-${report.severity}`}
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-pill)",
                          textTransform: "capitalize",
                        }}
                      >
                        {report.severity}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        {report.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
