"use client";

import HeroSection from "@/components/landing/HeroSection";
import FixedRevealCards from "@/components/landing/FixedRevealCards";
import PresentingSection from "@/components/landing/PresentingSection";
import { useEffect } from "react";

export default function LandingPage() {
  // Initialize scroll-reveal for all .reveal elements
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <main style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      <HeroSection />
      <FixedRevealCards />
      <PresentingSection />

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 24px",
          textAlign: "center",
          background: "var(--bg-base)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            color: "var(--civic-blue)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          <span>👁️</span>
          <span>CivicEye AI</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Built for citizens, by citizens. Powered by Gemini AI.
        </p>
      </footer>
    </main>
  );
}
