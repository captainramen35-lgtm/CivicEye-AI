"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle, Clock, TrendingUp, Shield } from "lucide-react";

const IMPACT_STATS = [
  { icon: CheckCircle, value: "12,482", label: "Issues Resolved", color: "#3E9C6B" },
  { icon: Clock, value: "4.2hrs", label: "Avg Resolution Time", color: "#2C6E8E" },
  { icon: TrendingUp, value: "94%", label: "Resolution Rate", color: "#E0A23B" },
  { icon: Shield, value: "48,900", label: "Active Citizens", color: "#8B5CF6" },
];

const STEPS = [
  { num: "01", title: "Snap a Photo", desc: "Point your camera at any civic issue — pothole, leak, garbage, broken light." },
  { num: "02", title: "AI Classifies It", desc: "Gemini Vision identifies the issue, severity, risk, and responsible department in under 2 seconds." },
  { num: "03", title: "Community Verifies", desc: "Neighbors confirm the issue, boosting its priority score so it gets attention faster." },
  { num: "04", title: "Track Resolution", desc: "Watch the status update in real-time: Assigned → In Progress → Resolved." },
];

export default function PresentingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = [sectionRef.current, ...stepsRef.current].filter(Boolean) as HTMLElement[];
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
  }, []);

  return (
    <>
      {/* Impact stats band — deep teal accent block */}
      <section
        style={{
          background: "linear-gradient(135deg, #1E4F66 0%, #2C6E8E 60%, #3D8CAF 100%)",
          padding: "80px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 80% at 80% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <h2
            className="reveal"
            ref={(el) => { if (el) sectionRef.current = el as unknown as HTMLElement; }}
            style={{
              textAlign: "center",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 800,
              color: "white",
              marginBottom: 56,
              letterSpacing: "-0.025em",
            }}
          >
            Real impact, real numbers
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 32,
            }}
          >
            {IMPACT_STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="reveal"
                  ref={(el) => { stepsRef.current[i] = el; }}
                  style={{ textAlign: "center", transitionDelay: `${i * 0.1}s` }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={22} color="white" />
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(2rem, 4vw, 3rem)",
                      fontWeight: 800,
                      color: "white",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works — 4 steps */}
      <section style={{ padding: "100px 24px", background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--civic-blue)",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 16,
              }}
            >
              The process
            </span>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
              }}
            >
              From photo to fix in 4 steps
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="reveal"
                ref={(el) => { stepsRef.current[4 + i] = el; }}
                style={{
                  display: "flex",
                  gap: 28,
                  alignItems: "flex-start",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "28px 32px",
                  boxShadow: "var(--shadow-sm)",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    minWidth: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section
        style={{
          padding: "100px 24px",
          background: "var(--bg-base)",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
        }}
      >
        <h2
          className="reveal"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 3rem)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          Ready to make your city better?
        </h2>
        <p
          className="reveal reveal-delay-1"
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            maxWidth: 480,
            margin: "0 auto 40px",
          }}
        >
          Join 48,900+ civic heroes already reporting and resolving issues in their cities.
        </p>
        <div
          className="reveal reveal-delay-2"
          style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/signup">
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "14px 36px" }}>
              Get Started Free →
            </button>
          </Link>
          <Link href="/leaderboard">
            <button className="btn-outline" style={{ fontSize: "1rem", padding: "12px 28px" }}>
              See Leaderboard
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
