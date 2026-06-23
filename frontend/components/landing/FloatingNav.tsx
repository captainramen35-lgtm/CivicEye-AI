"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { Eye, Menu, X, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: "/map", label: "Live Map" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function FloatingNav() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="floating-nav"
      style={{
        boxShadow: scrolled ? "var(--shadow-lg)" : "var(--shadow-md)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          color: "var(--civic-blue)",
          fontWeight: 800,
          fontSize: "1rem",
          letterSpacing: "-0.01em",
          flexShrink: 0,
        }}
      >
        <Eye size={20} strokeWidth={2.5} />
        CivicEye
      </Link>

      {/* Desktop nav links */}
      <div style={{ display: "flex", gap: 28 }} className="hidden md:flex">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              textDecoration: "none",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.color = "var(--civic-blue)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.color = "var(--text-secondary)")
            }
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <>
            <Link href="/report">
              <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                + Report
              </button>
            </Link>
            <Link href="/profile">
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--civic-blue), var(--civic-blue-light))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {user.displayName?.[0]?.toUpperCase() || "U"}
              </div>
            </Link>
            <button
              onClick={logout}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <Link href="/login">
              <button className="btn-outline" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                Sign in
              </button>
            </Link>
            <Link href="/signup">
              <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.85rem" }}>
                Sign up
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
