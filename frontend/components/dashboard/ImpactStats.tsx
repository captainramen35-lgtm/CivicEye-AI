"use client";

import { TrendingUp, TrendingDown, BarChart2, CheckCircle2, Clock, FileText } from "lucide-react";

interface StatsData {
  total_reported: number;
  total_resolved: number;
  resolution_rate: number;
  avg_resolution_hours: number;
  by_category?: Record<string, number>;
}

interface ImpactStatsProps {
  stats?: StatsData;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  trendLabel: string;
  delay?: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, trend, trendLabel, delay = "", loading = false }: StatCardProps) {
  if (loading) {
    return (
      <div
        className="reveal"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ width: "60%", height: 32, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ width: "80%", height: 16, borderRadius: "var(--radius)" }} />
        <div className="skeleton" style={{ width: "50%", height: 14, borderRadius: "var(--radius)" }} />
      </div>
    );
  }

  return (
    <div
      className={`reveal ${delay}`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--civic-blue)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius)",
          background: "rgba(44,110,142,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--civic-blue)",
          marginBottom: 4,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--civic-blue)",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>

      {/* Label */}
      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
        {label}
      </div>

      {/* Trend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: "0.78rem",
          fontWeight: 600,
          color: trend === "up" ? "var(--green-ok)" : "var(--red-alert)",
          marginTop: 2,
        }}
      >
        {trend === "up" ? (
          <TrendingUp size={13} strokeWidth={2} />
        ) : (
          <TrendingDown size={13} strokeWidth={2} />
        )}
        {trendLabel}
      </div>
    </div>
  );
}

export default function ImpactStats({ stats }: ImpactStatsProps) {
  const loading = !stats;

  const cards = [
    {
      label: "Total Reported",
      value: loading ? "—" : String(stats!.total_reported),
      icon: <FileText size={20} strokeWidth={2} />,
      trend: "up" as const,
      trendLabel: "+12% this month",
      delay: "reveal-delay-1",
    },
    {
      label: "Issues Resolved",
      value: loading ? "—" : String(stats!.total_resolved),
      icon: <CheckCircle2 size={20} strokeWidth={2} />,
      trend: "up" as const,
      trendLabel: "+8% this week",
      delay: "reveal-delay-2",
    },
    {
      label: "Resolution Rate",
      value: loading
        ? "—"
        : `${Math.round(stats!.resolution_rate * 100)}%`,
      icon: <BarChart2 size={20} strokeWidth={2} />,
      trend: stats && stats.resolution_rate >= 0.5 ? ("up" as const) : ("down" as const),
      trendLabel:
        stats && stats.resolution_rate >= 0.5 ? "Above target" : "Below target",
      delay: "reveal-delay-3",
    },
    {
      label: "Avg Resolution Time",
      value: loading
        ? "—"
        : stats!.avg_resolution_hours < 24
        ? `${Math.round(stats!.avg_resolution_hours)}h`
        : `${Math.round(stats!.avg_resolution_hours / 24)}d`,
      icon: <Clock size={20} strokeWidth={2} />,
      trend: stats && stats.avg_resolution_hours <= 48 ? ("up" as const) : ("down" as const),
      trendLabel:
        stats && stats.avg_resolution_hours <= 48 ? "Fast response" : "Needs improvement",
      delay: "reveal-delay-4",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          trend={card.trend}
          trendLabel={card.trendLabel}
          delay={card.delay}
          loading={loading}
        />
      ))}
    </div>
  );
}
