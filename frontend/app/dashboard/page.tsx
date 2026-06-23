"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getImpactStats, listIssues } from "@/lib/api";
import ImpactStats from "@/components/dashboard/ImpactStats";
import IssueFeedCard, { type Issue } from "@/components/dashboard/IssueFeedCard";
import FloatingNav from "@/components/landing/FloatingNav";
import {
  MapPin,
  AlertCircle,
  Star,
  CheckSquare,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const CATEGORY_FILTERS = ["All", "Road", "Water", "Waste", "Streetlight", "Drainage"];

interface StatsData {
  total_reported: number;
  total_resolved: number;
  resolution_rate: number;
  avg_resolution_hours: number;
  by_category?: Record<string, number>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Scroll-reveal hook
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<StatsData | undefined>(undefined);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [locationError, setLocationError] = useState(false);

  useReveal();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Fetch impact stats
  useEffect(() => {
    getImpactStats()
      .then((data) => setStats(data as unknown as StatsData))
      .catch(() => {
        // Provide mock fallback so UI is always populated
        setStats({
          total_reported: 142,
          total_resolved: 98,
          resolution_rate: 0.69,
          avg_resolution_hours: 36,
          by_category: { Road: 45, Water: 30, Waste: 25, Streetlight: 22, Drainage: 20 },
        });
      });
  }, []);

  // Fetch nearby issues
  const fetchIssues = useCallback((lat?: number, lng?: number) => {
    const params =
      lat && lng
        ? { lat, lng, radius_m: 5000 }
        : {};
    listIssues(params)
      .then((data) => setIssues(data as unknown as Issue[]))
      .catch(() => setIssues([]));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchIssues(pos.coords.latitude, pos.coords.longitude),
        () => {
          setLocationError(true);
          fetchIssues();
        },
        { timeout: 6000 }
      );
    } else {
      fetchIssues();
    }
  }, [fetchIssues]);

  // Filter issues client-side
  const filteredIssues =
    issues === null
      ? null
      : activeFilter === "All"
      ? issues
      : issues.filter((i) => i.category === activeFilter);

  // User's own impact (derived from profile data — static for now)
  const userReportCount = 12;
  const userVerifications = 34;
  const userBadgeLevel = user?.displayName ? "Civic Contributor" : "Community Reporter";

  if (authLoading) {
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
          <div
            className="skeleton"
            style={{ width: 48, height: 48, borderRadius: "50%" }}
          />
          <div className="skeleton" style={{ width: 180, height: 16, borderRadius: "var(--radius)" }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.displayName?.split(" ")[0] || "there";

  return (
    <main style={{ background: "var(--bg-base)", minHeight: "100vh", paddingBottom: 80 }}>
      <FloatingNav />

      {/* Page content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 0" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="reveal" style={{ marginBottom: 32 }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 4 }}>
            {formatDate()}
          </p>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            {getGreeting()},{" "}
            <span style={{ color: "var(--civic-blue)" }}>{firstName}</span> 👋
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: 8 }}>
            Here&apos;s what&apos;s happening in your city today.
          </p>
        </div>

        {/* ── Quick CTA Banner ────────────────────────────── */}
        <div
          className="reveal reveal-delay-1"
          style={{
            background: "linear-gradient(135deg, var(--civic-blue) 0%, var(--civic-blue-light) 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
              }}
            >
              <AlertCircle size={18} strokeWidth={2} />
              Spotted an issue?
            </div>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", margin: 0 }}>
              Report it in 30 seconds — our AI will classify it automatically.
            </p>
          </div>
          <Link href="/report">
            <button
              style={{
                background: "white",
                color: "var(--civic-blue)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "10px 24px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              Report Now
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </Link>
        </div>

        {/* ── Impact Stats ────────────────────────────────── */}
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
            📊 City Impact Overview
          </h2>
          <ImpactStats stats={stats} />
        </section>

        {/* ── Issues Near You ─────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <div
            className="reveal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MapPin size={18} strokeWidth={2} color="var(--civic-blue)" />
              Issues Near You
              {locationError && (
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                  (location unavailable — showing all)
                </span>
              )}
            </h2>

            <button
              onClick={() => {
                setIssues(null);
                fetchIssues();
              }}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-pill)",
                padding: "6px 14px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "border-color 0.15s",
              }}
            >
              <RefreshCw size={12} strokeWidth={2} />
              Refresh
            </button>
          </div>

          {/* Category filter chips */}
          <div
            className="reveal reveal-delay-1"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius-pill)",
                  border: activeFilter === cat ? "none" : "1px solid var(--border)",
                  background:
                    activeFilter === cat
                      ? "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))"
                      : "var(--bg-card)",
                  color: activeFilter === cat ? "white" : "var(--text-secondary)",
                  fontSize: "0.82rem",
                  fontWeight: activeFilter === cat ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: activeFilter === cat ? "var(--shadow-sm)" : "none",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Issue grid */}
          {issues === null ? (
            /* Loading skeletons */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <IssueFeedCard key={i} issue={null} />
              ))}
            </div>
          ) : filteredIssues!.length === 0 ? (
            /* Empty state */
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
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🌿</div>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                No issues reported in your area yet.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 20 }}>
                Be the first to make a difference!
              </p>
              <Link href="/report">
                <button className="btn-primary">Report an Issue</button>
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              {filteredIssues!.map((issue) => (
                <IssueFeedCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </section>

        {/* ── Your Impact ─────────────────────────────────── */}
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
            ⭐ Your Impact
          </h2>

          <div
            className="reveal reveal-delay-1"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 16,
            }}
          >
            {/* Reports filed */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📸</div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--civic-blue)",
                  lineHeight: 1,
                }}
              >
                {userReportCount}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>
                Reports Filed
              </div>
            </div>

            {/* Verifications */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>👍</div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--green-ok)",
                  lineHeight: 1,
                }}
              >
                {userVerifications}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 4 }}>
                Verifications
              </div>
            </div>

            {/* Badge level */}
            <div
              style={{
                background: "linear-gradient(135deg, var(--civic-blue) 0%, var(--civic-blue-light) 100%)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s ease",
                gridColumn: "span 1",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🌟</div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {userBadgeLevel}
              </div>
              <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                Current Badge
              </div>
              <Link href="/profile">
                <div
                  style={{
                    marginTop: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.78rem",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <Star size={12} strokeWidth={2} />
                  View Profile
                </div>
              </Link>
            </div>

            {/* Link to leaderboard */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = "translateY(0)")}
            >
              <div style={{ fontSize: "2.5rem" }}>🏆</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                See your rank
              </div>
              <Link href="/leaderboard">
                <button className="btn-outline" style={{ padding: "6px 18px", fontSize: "0.8rem" }}>
                  Leaderboard <CheckSquare size={12} style={{ display: "inline", marginLeft: 4 }} strokeWidth={2} />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
