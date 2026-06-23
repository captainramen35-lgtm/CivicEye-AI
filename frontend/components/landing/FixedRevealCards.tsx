"use client";
import { useEffect, useRef } from "react";
import { Brain, MapPin, Users } from "lucide-react";

const CARDS = [
  {
    icon: Brain,
    title: "AI-Powered Detection",
    description:
      "Gemini 2.5 Flash Vision analyzes your photo in under 2 seconds — classifying the issue type, severity, risk level, and responsible department automatically.",
    accent: "#2C6E8E",
    stat: "98% accuracy",
    delay: 0,
  },
  {
    icon: MapPin,
    title: "Smart Live Mapping",
    description:
      "Every report is pinned on an interactive OpenStreetMap. Heatmaps reveal problem hotspots. Filters let you focus on your neighborhood or a specific issue type.",
    accent: "#E0A23B",
    stat: "150m duplicate radius",
    delay: 150,
  },
  {
    icon: Users,
    title: "Community Power",
    description:
      "Neighbors verify reports, boosting their priority score. Gamification badges reward active citizens. The crowd collectively holds authorities accountable.",
    accent: "#3E9C6B",
    stat: "48,900+ reporters",
    delay: 300,
  },
];

export default function FixedRevealCards() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              card.classList.add("visible");
            }, CARDS[i].delay);
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      obs.observe(card);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section
      style={{
        padding: "100px 24px",
        background: "var(--bg-base)",
        position: "relative",
      }}
    >
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: 72 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "var(--civic-blue)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          How it works
        </span>
        <h2
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
          }}
        >
          Three pillars of civic change
        </h2>
      </div>

      {/* Cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="reveal"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "36px 32px",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease, opacity 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-lg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${card.accent}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <Icon size={24} color={card.accent} strokeWidth={2} />
              </div>

              {/* Content */}
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 12,
                  letterSpacing: "-0.01em",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                {card.description}
              </p>

              {/* Stat pill */}
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: card.accent,
                  background: `${card.accent}12`,
                  border: `1px solid ${card.accent}30`,
                  borderRadius: "var(--radius-pill)",
                  padding: "4px 12px",
                }}
              >
                {card.stat}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
