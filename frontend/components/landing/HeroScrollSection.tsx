"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ParticleCanvas from "./ParticleCanvas";

const STATS = [
  { label: "Issues Resolved", value: "12,482", suffix: "this month" },
  { label: "Active Citizens", value: "48,900+", suffix: "reporters" },
  { label: "Cities Covered", value: "23", suffix: "and growing" },
];

export default function HeroScrollSection() {
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallax = -scrollY * 0.35;
  const opacity = Math.max(0, 1 - scrollY / 500);

  return (
    <section
      ref={heroRef}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-base)",
        padding: "120px 24px 80px",
      }}
    >
      <ParticleCanvas />

      {/* Subtle radial gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(44,110,142,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          maxWidth: 780,
          opacity,
          transform: `translateY(${parallax}px)`,
          transition: "none",
        }}
      >
        {/* Live stat code-box */}
        <div
          style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
          className="reveal visible"
        >
          <span className="code-box">
            <span className="pulse-dot" />
            <span>⚡ 12,482 issues resolved this month</span>
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="reveal reveal-delay-1"
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            color: "var(--text-primary)",
            marginBottom: 24,
          }}
        >
          Your city&apos;s problems,{" "}
          <br />
          <span className="underline-accent" style={{ color: "var(--civic-blue)" }}>
            report, verify, resolve
          </span>
        </h1>

        <p
          className="reveal reveal-delay-2"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "0 auto 48px",
            lineHeight: 1.7,
          }}
        >
          Upload a photo. Gemini AI classifies the issue in seconds. Your
          community verifies it. Authorities fix it — tracked every step of the
          way.
        </p>

        {/* CTA buttons */}
        <div
          className="reveal reveal-delay-3"
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/report">
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
              Report an Issue →
            </button>
          </Link>
          <Link href="/map">
            <button className="btn-outline" style={{ fontSize: "1rem", padding: "12px 28px" }}>
              View Live Map
            </button>
          </Link>
        </div>

        {/* Mini stats row */}
        <div
          className="reveal reveal-delay-4"
          style={{
            display: "flex",
            gap: 48,
            justifyContent: "center",
            marginTop: 72,
            flexWrap: "wrap",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  color: "var(--civic-blue)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                {s.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", opacity: 0.7 }}>
                {s.suffix}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: Math.max(0, 1 - scrollY / 200),
        }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          SCROLL
        </span>
        <div
          style={{
            width: 1,
            height: 48,
            background: "linear-gradient(to bottom, var(--civic-blue), transparent)",
            animation: "pulse 2s ease infinite",
          }}
        />
      </div>
    </section>
  );
}
