"use client";

interface BadgeConfig {
  label: string;
  emoji: string;
  gradient: string;
  color: string;
}

const BADGE_MAP: Record<string, BadgeConfig> = {
  community_reporter: {
    label: "Community Reporter",
    emoji: "📸",
    gradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)",
    color: "#334155",
  },
  civic_contributor: {
    label: "Civic Contributor",
    emoji: "🌟",
    gradient: "linear-gradient(135deg, var(--amber) 0%, #f5c567 100%)",
    color: "#92651A",
  },
  community_hero: {
    label: "Community Hero",
    emoji: "🦸",
    gradient: "linear-gradient(135deg, var(--green-ok) 0%, #52b585 100%)",
    color: "#1A7A52",
  },
  city_guardian: {
    label: "City Guardian",
    emoji: "📜",
    gradient: "linear-gradient(135deg, var(--civic-blue) 0%, var(--civic-blue-light) 100%)",
    color: "var(--civic-blue-dark)",
  },
};

// Friendly fallback for unknown badge types
function normalizeBadgeType(badge_type: string): string {
  return badge_type
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

export interface BadgeData {
  badge_type: string;
  awarded_at?: string;
}

interface BadgeCardProps {
  badge: BadgeData;
  isEarned?: boolean;
}

export default function BadgeCard({ badge, isEarned = true }: BadgeCardProps) {
  const key = normalizeBadgeType(badge.badge_type);
  const config = BADGE_MAP[key] ?? {
    label: badge.badge_type,
    emoji: "🏅",
    gradient: "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)",
    color: "#475569",
  };

  const awardedDate =
    badge.awarded_at
      ? new Date(badge.awarded_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        filter: isEarned ? "none" : "grayscale(1)",
        opacity: isEarned ? 1 : 0.4,
        position: "relative",
        transition: "transform 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
      }}
    >
      {/* Icon area */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "var(--radius-lg)",
          background: config.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem",
          boxShadow: isEarned ? "var(--shadow-sm)" : "none",
          position: "relative",
        }}
      >
        {config.emoji}

        {/* Locked overlay */}
        {!isEarned && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "var(--radius-lg)",
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "white",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🔒 Locked
          </div>
        )}
      </div>

      {/* Badge name */}
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: isEarned ? config.color : "var(--text-muted)",
          textAlign: "center",
          maxWidth: 90,
          lineHeight: 1.3,
        }}
      >
        {config.label}
      </div>

      {/* Date awarded */}
      {isEarned && awardedDate && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          {awardedDate}
        </div>
      )}

      {!isEarned && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Not yet earned
        </div>
      )}
    </div>
  );
}
