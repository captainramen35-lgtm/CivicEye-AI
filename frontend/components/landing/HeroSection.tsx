"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

const HERO_VIDEO_URL = "/hero-video.mp4";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="hero-dark-scope relative min-h-screen overflow-hidden flex flex-col justify-between">
      {/* Scope Styles Locally */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');

        .hero-dark-scope {
          --background: 201 100% 8%;       /* deep navy blue background */
          --foreground: 0 0% 100%;          /* white */
          --muted-foreground: 240 4% 75%;   /* muted gray */
          --primary: 0 0% 100%;
          --primary-foreground: 0 0% 4%;
          --secondary: 0 0% 10%;
          --muted: 0 0% 10%;
          --accent: 0 0% 10%;
          --border: 201 100% 16%;
          --input: 0 0% 18%;

          background: hsl(var(--background));
          color: hsl(var(--foreground));
          font-family: 'Inter', sans-serif;
        }

        @media (max-width: 768px) {
          .nav-links-wrapper {
            display: none !important;
          }
        }

        .hero-dark-scope a, 
        .hero-dark-scope a:hover, 
        .hero-dark-scope a:focus,
        .hero-dark-scope button,
        .hero-dark-scope button:hover {
          text-decoration: none !important;
          outline: none !important;
        }

        @keyframes fade-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-rise {
          animation: fade-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-rise-delay {
          animation: fade-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        .animate-fade-rise-delay-2 {
          animation: fade-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }
      `}</style>

      {/* 1. Video Background with Scrim */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {mounted && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            poster="/hero-poster.jpg"
            style={{ filter: "brightness(0.5) contrast(1.15)" }}
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        )}
        {/* Dark Scrim */}
        <div className="absolute inset-0 bg-black/30 z-0" />
      </div>

      {/* 2. Navigation Bar */}
      <header className="relative z-10 w-full">
        <nav style={{
          position: 'relative', zIndex: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: '1280px', margin: '0 auto',
          padding: '1.5rem 2rem'
        }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              color: '#fff',
              fontSize: '1.75rem',
              fontFamily: "'Instrument Serif', serif"
            }}
          >
            <Eye size={24} strokeWidth={2.5} style={{ color: '#fff' }} />
            <span style={{ lineHeight: '1' }}>
              CivicEye<sup style={{ fontSize: '0.65rem' }}>AI</sup>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="nav-links-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link
              href="/"
              style={{ fontSize: '0.875rem', color: '#fff', textDecoration: 'none' }}
            >
              Home
            </Link>
            <Link
              href="/report"
              style={{ fontSize: '0.875rem', color: '#a1a1aa', textDecoration: 'none' }}
              className="hover:text-white transition-colors"
            >
              Report
            </Link>
            <Link
              href="/map"
              style={{ fontSize: '0.875rem', color: '#a1a1aa', textDecoration: 'none' }}
              className="hover:text-white transition-colors"
            >
              Map
            </Link>
            <Link
              href="/authority"
              style={{ fontSize: '0.875rem', color: '#a1a1aa', textDecoration: 'none' }}
              className="hover:text-white transition-colors"
            >
              For Authorities
            </Link>
            <Link
              href="/leaderboard"
              style={{ fontSize: '0.875rem', color: '#a1a1aa', textDecoration: 'none' }}
              className="hover:text-white transition-colors"
            >
              Leaderboard
            </Link>
          </div>

          {/* CTA Nav Button */}
          <Link href="/report" style={{ textDecoration: 'none' }}>
            <button style={{ background: '#fff', color: '#000', borderRadius: '999px', padding: '0.6rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              Report an Issue
            </button>
          </Link>
        </nav>
      </header>

      {/* 3. Hero Content */}
      <div 
        className="animate-fade-rise"
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', width: '100%', maxWidth: '1100px',
          margin: '0 auto', minHeight: 'calc(100vh - 120px)',
          padding: '0 1.5rem'
        }}
      >
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontWeight: 400,
          fontSize: 'clamp(2.5rem, 6vw, 6rem)', lineHeight: 1.05,
          letterSpacing: '-2px', margin: 0, color: '#fff'
        }}>
          Every pothole has <span style={{ color: '#a1a1aa' }}>a voice now.</span>
        </h1>

        <p style={{ color: '#a1a1aa', fontSize: '1.125rem', maxWidth: '640px', marginTop: '2rem', lineHeight: 1.6 }} className="animate-fade-rise-delay">
          Snap a photo, drop a pin, and watch your city respond. CivicEye AI turns scattered complaints into verified, tracked, resolved community action.
        </p>

        <Link href="/report" style={{ textDecoration: 'none' }} className="no-underline hover:no-underline animate-fade-rise-delay-2">
          <button style={{
            background: '#fff', color: '#000', borderRadius: '999px',
            padding: '1.25rem 3.5rem', fontSize: '1.125rem', fontWeight: 600,
            border: 'none', marginTop: '3rem', cursor: 'pointer'
          }}>
            Start Reporting
          </button>
        </Link>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#a1a1aa' }}>
          12,482 issues resolved · 47 cities · 100% transparent tracking
        </p>
      </div>

      {/* Bottom Spacer */}
      <div className="h-10 w-full relative z-10 bg-gradient-to-t from-transparent to-transparent" />
    </section>
  );
}
