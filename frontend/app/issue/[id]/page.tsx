"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  MapPin,
  Users,
  AlertTriangle,
  Star,
  Tag,
  Building2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import FloatingNav from "@/components/landing/FloatingNav";
import StatusTimeline from "@/components/issue/StatusTimeline";
import VerifyPanel from "@/components/issue/VerifyPanel";
import { useAuth } from "@/lib/authContext";
import { StatusHistoryItem } from "@/components/issue/StatusTimeline";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface IssueDetail {
  id: string;
  issue_type: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: string;
  address?: string;
  description?: string;
  priority_score?: number;
  verification_count?: number;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  risk_notes?: string;
  department?: string;
  reported_at?: string;
  status_history?: StatusHistoryItem[];
  reporter_id?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const SEVERITY_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; ring: string }
> = {
  high: {
    label: "High",
    bg: "rgba(209,69,69,0.1)",
    color: "#A52D2D",
    ring: "#D14545",
  },
  medium: {
    label: "Medium",
    bg: "rgba(224,162,59,0.1)",
    color: "#9A6B1A",
    ring: "#E0A23B",
  },
  low: {
    label: "Low",
    bg: "rgba(62,156,107,0.1)",
    color: "#2A7A56",
    ring: "#3E9C6B",
  },
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  ai_verified: "AI Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  reported: "badge-reported",
  ai_verified: "badge-ai_verified",
  assigned: "badge-assigned",
  in_progress: "badge-in_progress",
  resolved: "badge-resolved",
};

function priorityColor(score: number): string {
  if (score >= 75) return "#D14545";
  if (score >= 45) return "#E0A23B";
  return "#3E9C6B";
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBlock({ w, h }: { w?: string | number; h?: string | number }) {
  return (
    <div
      className="skeleton"
      style={{
        width: w ?? "100%",
        height: h ?? 20,
        borderRadius: 8,
      }}
    />
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Scroll-reveal refs
  const heroRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const verifyRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);

  // ─── Reveal observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const els = [heroRef, infoRef, timelineRef, verifyRef, relatedRef].map(
      (r) => r.current
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [issue]);

  // ─── Fetch issue ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    async function fetchIssue() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/issues/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Issue not found");
          throw new Error(`Server error (${res.status})`);
        }
        const data: any = await res.json();
        const mapped: IssueDetail = {
          ...data,
          latitude: data.latitude ?? data.lat,
          longitude: data.longitude ?? data.lng,
        };
        setIssue(mapped);
      } catch (err: unknown) {
        // Fallback mock for development (only for pre-seeded or issue_ IDs)
        if (id && (id.startsWith("issue_") || id.length < 10)) {
          const mock: IssueDetail = {
            id,
            issue_type: "Severe Pothole",
            category: "Pothole",
            severity: "high",
            status: "ai_verified",
            address: "MG Road, Near Metro Station, Bengaluru — 560001",
            description:
              "A large pothole approximately 1.2m wide and 15cm deep has formed near the bus stop on MG Road. It poses a serious safety risk to two-wheelers and pedestrians.",
            priority_score: 87,
            verification_count: 14,
            latitude: 12.9716,
            longitude: 77.5946,
            photo_url: "https://images.unsplash.com/photo-1597200381847-30ec200eeb9a?auto=format&fit=crop&q=80&w=800",
            risk_notes:
              "High risk of vehicle damage and potential accidents especially during heavy rain when the pothole becomes invisible. Immediate attention required.",
            department: "BBMP Roads & Infrastructure",
            reported_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            status_history: [
              {
                status: "reported",
                timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
                actor: "Priya Sharma",
                note: "Spotted this pothole on my daily commute. Very dangerous.",
              },
              {
                status: "ai_verified",
                timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
                actor: "CivicEye AI",
                note: "Image analysis confirmed: pothole detected with 94% confidence.",
              },
            ],
          };
          setIssue(mock);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load issue");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchIssue();
  }, [id]);

  // ─── Share ──────────────────────────────────────────────────────────────────
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: issue?.issue_type ?? "CivicEye Issue",
          text: `Check out this civic issue: ${issue?.issue_type}`,
          url,
        });
        return;
      } catch {
        /* fallthrough */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* ignore */
    }
  }

  // ─── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <FloatingNav />
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "100px 20px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: "100%", height: 320, borderRadius: 20 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonBlock h={32} w="60%" />
            <SkeletonBlock h={20} w="40%" />
            <SkeletonBlock h={80} />
            <SkeletonBlock h={20} w="70%" />
            <SkeletonBlock h={20} w="55%" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          fontFamily: "'Inter', sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FloatingNav />
        <div
          style={{
            textAlign: "center",
            padding: "40px 24px",
            maxWidth: 400,
          }}
        >
          <AlertTriangle
            size={48}
            strokeWidth={1.5}
            color="var(--red-alert)"
            style={{ marginBottom: 16 }}
          />
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            Issue Not Found
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            {error}
          </p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const sevCfg = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.low;
  const score = issue.priority_score ?? 0;
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDash = (score / 100) * circumference;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <FloatingNav />

      <div
        style={{
          maxWidth: 740,
          margin: "0 auto",
          padding: "100px 20px 80px",
        }}
      >
        {/* ── Header bar ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
            gap: 12,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-pill)",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.15s ease",
            }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Status badge */}
            <span
              className={STATUS_BADGE_CLASS[issue.status] ?? "badge-reported"}
              style={{
                padding: "5px 14px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              {STATUS_LABELS[issue.status] ?? issue.status}
            </span>

            {/* Share button */}
            <button
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: copied
                  ? "rgba(62,156,107,0.1)"
                  : "var(--bg-card)",
                border: "1px solid",
                borderColor: copied ? "var(--green-ok)" : "var(--border)",
                borderRadius: "var(--radius-pill)",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: copied ? "var(--green-ok)" : "var(--text-secondary)",
                boxShadow: "var(--shadow-sm)",
                transition: "all 0.2s ease",
              }}
            >
              {copied ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                <Share2 size={14} strokeWidth={2} />
              )}
              {copied ? "Copied!" : "Share"}
            </button>
          </div>
        </div>

        {/* ── Hero photo ──────────────────────────────────────────────────────── */}
        <div ref={heroRef} className="reveal" style={{ marginBottom: 28 }}>
          {issue.photo_url && !imgError ? (
            <div
              style={{
                width: "100%",
                maxHeight: 400,
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-md)",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.photo_url}
                alt={issue.issue_type}
                onError={() => setImgError(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: 400,
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {/* Gradient overlay for readability */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.45), transparent)",
                  borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: 220,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(44,110,142,0.08), rgba(44,110,142,0.04))",
                border: "2px dashed var(--border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "var(--text-muted)",
              }}
            >
              <AlertTriangle size={36} strokeWidth={1.5} />
              <p style={{ fontSize: "0.85rem" }}>No photo available</p>
            </div>
          )}
        </div>

        {/* ── Issue info card ──────────────────────────────────────────────────── */}
        <div
          ref={infoRef}
          className="reveal reveal-delay-1"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              marginBottom: 16,
            }}
          >
            {issue.issue_type}
          </h1>

          {/* Badges row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {/* Category */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.78rem",
                fontWeight: 600,
                background: "rgba(44,110,142,0.08)",
                color: "var(--civic-blue)",
                border: "1px solid rgba(44,110,142,0.2)",
              }}
            >
              <Tag size={12} strokeWidth={2} />
              {issue.category}
            </span>

            {/* Severity */}
            <span
              style={{
                display: "inline-block",
                padding: "5px 12px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.78rem",
                fontWeight: 700,
                background: sevCfg.bg,
                color: sevCfg.color,
                border: `1px solid ${sevCfg.ring}33`,
              }}
            >
              {sevCfg.label} Severity
            </span>

            {/* Department */}
            {issue.department && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  background: "rgba(113,128,150,0.08)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <Building2 size={12} strokeWidth={2} />
                {issue.department}
              </span>
            )}
          </div>

          {/* Description */}
          {issue.description && (
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.65,
                marginBottom: 20,
              }}
            >
              {issue.description}
            </p>
          )}

          {/* Risk notes callout */}
          {issue.risk_notes && (
            <div
              style={{
                background: "rgba(224,162,59,0.08)",
                border: "1px solid rgba(224,162,59,0.3)",
                borderLeft: "4px solid var(--amber)",
                borderRadius: "var(--radius)",
                padding: "14px 16px",
                marginBottom: 24,
                display: "flex",
                gap: 12,
              }}
            >
              <AlertTriangle
                size={18}
                strokeWidth={2}
                color="var(--amber)"
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "#92651A",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Risk Assessment
                </p>
                <p
                  style={{
                    fontSize: "0.87rem",
                    color: "#6B4A1B",
                    lineHeight: 1.55,
                  }}
                >
                  {issue.risk_notes}
                </p>
              </div>
            </div>
          )}

          {/* Priority + Verification row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 24,
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            {/* Priority ring */}
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width={88} height={88} viewBox="0 0 88 88">
                  {/* Track */}
                  <circle
                    cx={44}
                    cy={44}
                    r={36}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={6}
                  />
                  {/* Progress */}
                  <circle
                    cx={44}
                    cy={44}
                    r={36}
                    fill="none"
                    stroke={priorityColor(score)}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={circumference * 0.25}
                    style={{ transition: "stroke-dasharray 1s ease" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 900,
                      color: priorityColor(score),
                      lineHeight: 1,
                    }}
                  >
                    {score}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Verification count */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "rgba(62,156,107,0.06)",
                  borderRadius: "var(--radius)",
                  border: "1px solid rgba(62,156,107,0.15)",
                }}
              >
                <Users size={16} strokeWidth={2} color="var(--green-ok)" />
                <div>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "var(--green-ok)",
                    }}
                  >
                    {issue.verification_count ?? 0}
                  </span>
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    community verifications
                  </span>
                </div>
              </div>

              {/* Reported date */}
              {issue.reported_at && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "var(--bg-base)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Star size={16} strokeWidth={2} color="var(--amber)" />
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Reported{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      {new Date(issue.reported_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* GPS / Address */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-base)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <MapPin
              size={16}
              strokeWidth={2}
              color="var(--civic-blue)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              {issue.address && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    marginBottom: issue.latitude ? 4 : 0,
                  }}
                >
                  {issue.address}
                </p>
              )}
              {issue.latitude && issue.longitude && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "monospace",
                  }}
                >
                  {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                </p>
              )}
            </div>
            {issue.latitude && issue.longitude && (
              <a
                href={`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.75rem",
                  color: "var(--civic-blue)",
                  textDecoration: "none",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                <ExternalLink size={12} strokeWidth={2} />
                Maps
              </a>
            )}
          </div>

          {/* Copy Issue ID */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(issue.id).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.73rem",
              color: "var(--text-muted)",
              padding: 0,
            }}
          >
            <Copy size={11} />
            Issue #{issue.id}
          </button>
        </div>

        {/* ── Status Timeline ──────────────────────────────────────────────────── */}
        <div
          ref={timelineRef}
          className="reveal reveal-delay-2"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            marginBottom: 24,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--text-primary)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--civic-blue)",
                display: "inline-block",
              }}
            />
            Resolution Progress
          </h2>
          <StatusTimeline
            statusHistory={issue.status_history ?? []}
            currentStatus={issue.status}
          />
        </div>

        {/* ── Verify Panel ─────────────────────────────────────────────────────── */}
        <div ref={verifyRef} className="reveal reveal-delay-3" style={{ marginBottom: 24 }}>
          <VerifyPanel
            issueId={issue.id}
            currentUser={user}
            verificationCount={issue.verification_count ?? 0}
          />
        </div>

        {/* ── Related Issues ───────────────────────────────────────────────────── */}
        <div
          ref={relatedRef}
          className="reveal reveal-delay-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "28px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--text-primary)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MapPin size={16} strokeWidth={2} color="var(--civic-blue)" />
            Nearby Issues
          </h2>

          {/* Placeholder grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  padding: "14px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg-base)",
                }}
              >
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: "50%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: "40%" }} />
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "2px solid var(--civic-blue)",
                borderTopColor: "transparent",
                animation: "spin 0.9s linear infinite",
              }}
            />
            Loading nearby issues…
          </p>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/map">
              <button className="btn-outline" style={{ fontSize: "0.83rem", padding: "9px 22px" }}>
                View All on Map
              </button>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
