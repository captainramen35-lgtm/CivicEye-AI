"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import FloatingNav from "@/components/landing/FloatingNav";
import {
  Layers,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertTriangle,
  Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Issue {
  id: string;
  issue_type: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: string;
  address?: string;
  priority_score?: number;
  latitude: number;
  longitude: number;
  photo_url?: string;
  verification_count?: number;
}

interface Filters {
  category: string;
  status: string;
  severity: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const CATEGORIES = [
  "All",
  "Pothole",
  "Street Light",
  "Garbage",
  "Water Supply",
  "Sewage",
  "Road Damage",
  "Other",
];
const STATUSES = ["All", "reported", "ai_verified", "assigned", "in_progress", "resolved"];
const SEVERITIES = ["All", "high", "medium", "low"];

const SEVERITY_COLORS: Record<string, string> = {
  high: "#D14545",
  medium: "#E0A23B",
  low: "#3E9C6B",
  resolved: "#94A3B8",
};

const STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  ai_verified: "AI Verified",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function markerColor(issue: Issue): string {
  if (issue.status === "resolved") return SEVERITY_COLORS.resolved;
  return SEVERITY_COLORS[issue.severity] ?? "#94A3B8";
}

function createMarkerEl(issue: Issue): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 18px; height: 18px;
    border-radius: 50%;
    background: ${markerColor(issue)};
    border: 2.5px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    cursor: pointer;
    transition: transform 0.15s ease;
  `;
  el.onmouseenter = () => (el.style.transform = "scale(1.4)");
  el.onmouseleave = () => (el.style.transform = "scale(1)");
  return el;
}

function severityBadgeHtml(severity: string): string {
  const colors: Record<string, string> = {
    high: "background:rgba(209,69,69,0.12);color:#A52D2D;border:1px solid rgba(209,69,69,0.25)",
    medium: "background:rgba(224,162,59,0.12);color:#9A6B1A;border:1px solid rgba(224,162,59,0.25)",
    low: "background:rgba(62,156,107,0.12);color:#2A7A56;border:1px solid rgba(62,156,107,0.25)",
  };
  const style = colors[severity] ?? "";
  return `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:0.72rem;font-weight:600;${style}">${severity.toUpperCase()}</span>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [filtered, setFiltered] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ category: "All", status: "All", severity: "All" });
  const [heatmap, setHeatmap] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inViewCount, setInViewCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ─── Fetch issues ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchIssues() {
      try {
        const res = await fetch(`${API_BASE}/issues/`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map((item: any) => ({
            ...item,
            latitude: item.latitude ?? item.lat,
            longitude: item.longitude ?? item.lng,
          }));
          setIssues(mapped);
          setFiltered(mapped);
        }
      } catch {
        // Fallback mock data if server is unreachable
        setIssues(prev => prev.length > 0 ? prev : [
          { id: "1", issue_type: "Pothole", category: "Pothole", severity: "high", status: "reported", address: "MG Road, Bengaluru", priority_score: 87, latitude: 12.9716, longitude: 77.5946, verification_count: 14 },
          { id: "2", issue_type: "Broken Street Light", category: "Street Light", severity: "medium", status: "ai_verified", address: "Indiranagar, Bengaluru", priority_score: 63, latitude: 12.9784, longitude: 77.6408, verification_count: 7 },
          { id: "3", issue_type: "Garbage Overflow", category: "Garbage", severity: "high", status: "in_progress", address: "Koramangala, Bengaluru", priority_score: 92, latitude: 12.9352, longitude: 77.6245, verification_count: 21 },
          { id: "4", issue_type: "Water Logging", category: "Water Supply", severity: "low", status: "resolved", address: "Whitefield, Bengaluru", priority_score: 34, latitude: 12.9698, longitude: 77.7500, verification_count: 3 },
          { id: "5", issue_type: "Damaged Road", category: "Road Damage", severity: "medium", status: "assigned", address: "HSR Layout, Bengaluru", priority_score: 71, latitude: 12.9116, longitude: 77.6389, verification_count: 9 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchIssues();

    // 10 second polling interval for real-time issues feed
    const interval = setInterval(fetchIssues, 10000);
    return () => clearInterval(interval);
  }, []);

  // ─── Apply filters ──────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...issues];
    if (filters.category !== "All")
      result = result.filter((i) => i.category === filters.category);
    if (filters.status !== "All")
      result = result.filter((i) => i.status === filters.status);
    if (filters.severity !== "All")
      result = result.filter((i) => i.severity === filters.severity);
    setFiltered(result);
  }, [filters, issues]);

  // ─── Init map & User Geolocation ───────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [77.5946, 12.9716], // Default center
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.on("load", () => {
      setMapReady(true);
      
      // Attempt to center map on citizen's live GPS coordinates
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            map.flyTo({
              center: [longitude, latitude],
              zoom: 12,
              duration: 1500,
            });
          },
          () => {} // Ignored/denied fallback
        );
      }
    });

    map.on("moveend", () => {
      if (!mapRef.current) return;
      const bounds = mapRef.current.getBounds();
      const cnt = filtered.filter((i) =>
        bounds.contains([i.longitude, i.latitude])
      ).length;
      setInViewCount(cnt);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fit bounds to issues on load ──────────────────────────────────────────
  const [hasFittedBounds, setHasFittedBounds] = useState(false);
  useEffect(() => {
    if (mapReady && mapRef.current && issues.length > 0 && !hasFittedBounds) {
      const lats = issues.map((i) => i.latitude).filter(Boolean);
      const lngs = issues.map((i) => i.longitude).filter(Boolean);
      if (lats.length > 0 && lngs.length > 0) {
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);

        if (maxLng - minLng < 0.005 && maxLat - minLat < 0.005) {
          mapRef.current.flyTo({
            center: [lngs[0], lats[0]],
            zoom: 13,
            duration: 1200,
          });
        } else {
          mapRef.current.fitBounds(
            [
              [minLng, minLat], // sw
              [maxLng, maxLat], // ne
            ],
            { padding: 80, maxZoom: 14 }
          );
        }
        setHasFittedBounds(true);
      }
    }
  }, [mapReady, issues, hasFittedBounds]);

  // ─── Add/update markers ─────────────────────────────────────────────────────
  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !mapReady) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    filtered.forEach((issue) => {
      if (!issue.latitude || !issue.longitude) return;
      const el = createMarkerEl(issue);

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        maxWidth: "260px",
      }).setHTML(`
        <div style="font-family:'Inter',sans-serif;padding:4px 0;">
          <p style="font-weight:700;font-size:0.92rem;color:#1A1F2E;margin-bottom:6px;line-height:1.3">${issue.issue_type}</p>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
            ${severityBadgeHtml(issue.severity)}
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:0.72rem;font-weight:600;background:rgba(44,110,142,0.1);color:#2C6E8E">${STATUS_LABELS[issue.status] ?? issue.status}</span>
          </div>
          ${issue.address ? `<p style="font-size:0.78rem;color:#4A5568;margin-bottom:4px">📍 ${issue.address}</p>` : ""}
          ${issue.priority_score != null ? `<p style="font-size:0.78rem;color:#718096;margin-bottom:4px">Priority: <strong style="color:#1A1F2E">${issue.priority_score}/100</strong></p>` : ""}
          ${issue.verification_count != null ? `<p style="font-size:0.78rem;color:#718096;margin-bottom:10px">👍 ${issue.verification_count} verifications</p>` : ""}
          <a href="/issue/${issue.id}" style="display:block;text-align:center;background:linear-gradient(135deg,#2C6E8E,#3D8CAF);color:white;border-radius:9999px;padding:7px 16px;font-weight:600;font-size:0.8rem;text-decoration:none">
            View Details →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([issue.longitude, issue.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Update in-view count
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      setInViewCount(
        filtered.filter((i) => bounds.contains([i.longitude, i.latitude])).length
      );
    }
  }, [filtered, mapReady]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // ─── Heatmap toggle ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = "issues-heat";
    const layerId = "issues-heat-layer";

    if (heatmap) {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: filtered.map((i) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: [i.longitude, i.latitude] },
              properties: { priority: i.priority_score ?? 50 },
            })),
          },
        });
      } else {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: filtered.map((i) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [i.longitude, i.latitude] },
            properties: { priority: i.priority_score ?? 50 },
          })),
        });
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "heatmap",
          source: sourceId,
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "priority"], 0, 0, 100, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 20, 15, 60],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(62,156,107,0)",
              0.2, "rgba(62,156,107,0.6)",
              0.5, "rgba(224,162,59,0.8)",
              0.8, "rgba(209,69,69,0.9)",
              1, "rgba(209,69,69,1)",
            ],
            "heatmap-opacity": 0.7,
          },
        });
      }
    } else {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
  }, [heatmap, filtered, mapReady]);

  // ─── Nominatim search ───────────────────────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current.flyTo({
          center: [parseFloat(lon), parseFloat(lat)],
          zoom: 14,
          duration: 1800,
          essential: true,
        });
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }

  // ─── Filter chip component ──────────────────────────────────────────────────
  function FilterChips({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: string[];
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          {label}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid",
                borderColor:
                  value === opt ? "var(--civic-blue)" : "var(--border)",
                background:
                  value === opt
                    ? "var(--civic-blue)"
                    : "var(--bg-card)",
                color:
                  value === opt ? "white" : "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: value === opt ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {opt === "All"
                ? "All"
                : opt.charAt(0).toUpperCase() + opt.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const filtersPanel = (
    <div>
      <FilterChips
        label="Category"
        options={CATEGORIES}
        value={filters.category}
        onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
      />
      <FilterChips
        label="Status"
        options={STATUSES}
        value={filters.status}
        onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
      />
      <FilterChips
        label="Severity"
        options={SEVERITIES}
        value={filters.severity}
        onChange={(v) => setFilters((f) => ({ ...f, severity: v }))}
      />
      {(filters.category !== "All" || filters.status !== "All" || filters.severity !== "All") && (
        <button
          onClick={() => setFilters({ category: "All", status: "All", severity: "All" })}
          style={{
            marginTop: 4,
            fontSize: "0.78rem",
            color: "var(--red-alert)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
          }}
        >
          <X size={12} />
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <FloatingNav />

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          width: "min(480px, calc(100vw - 32px))",
        }}
      >
        <form onSubmit={handleSearch}>
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-pill)",
              boxShadow: "var(--shadow-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: 16,
                color: "var(--text-muted)",
              }}
            >
              <Search size={17} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search address or neighbourhood…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "11px 12px",
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 10px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              disabled={searching}
              style={{
                background: "var(--civic-blue)",
                color: "white",
                border: "none",
                padding: "10px 18px",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
                transition: "background 0.15s ease",
              }}
            >
              {searching ? "…" : "Go"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Desktop filter panel (left sidebar) ─────────────────────────────── */}
      <div
        className="hidden md:block"
        style={{
          position: "fixed",
          top: 140,
          left: 20,
          zIndex: 40,
          width: 260,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--text-primary)",
            }}
          >
            <Filter size={16} strokeWidth={2} color="var(--civic-blue)" />
            Filters
          </div>
          <button
            onClick={() => setFilterOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
            }}
          >
            {filterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {(!filterOpen) && filtersPanel}
      </div>

      {/* ── Issue count badge ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 100,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-pill)",
          padding: "8px 20px",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.83rem",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        <MapPin size={14} strokeWidth={2} color="var(--civic-blue)" />
        <span style={{ color: "var(--civic-blue)", fontWeight: 800 }}>
          {inViewCount}
        </span>{" "}
        issues in view
        {loading && (
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            · Loading…
          </span>
        )}
      </div>

      {/* ── Heatmap toggle ───────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 140,
          right: 20,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Live Feed Active badge */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 14px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#3E9C6B",
              display: "inline-block",
              boxShadow: "0 0 6px #3E9C6B",
            }}
            className="pulse-dot"
          />
          Live Feed
        </div>

        <button
          onClick={() => setHeatmap((h) => !h)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid",
            borderColor: heatmap ? "var(--civic-blue)" : "var(--border)",
            background: heatmap
              ? "var(--civic-blue)"
              : "rgba(255,255,255,0.95)",
            color: heatmap ? "white" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.82rem",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease",
          }}
        >
          <Layers size={15} strokeWidth={2} />
          {heatmap ? "Heatmap ON" : "Heatmap"}
        </button>

        <Link href="/report">
          <button
            className="btn-primary"
            style={{ padding: "10px 16px", fontSize: "0.82rem", width: "100%" }}
          >
            + Report Issue
          </button>
        </Link>
      </div>

      {/* ── Map container ────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          top: 64,
          zIndex: 0,
        }}
      >
        {/* Loading overlay */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "var(--bg-base)",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--civic-blue)",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[280, 200, 240].map((w, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ width: w, height: 16, borderRadius: 8 }}
                />
              ))}
            </div>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: 8,
              }}
            >
              Loading civic issues…
            </p>
          </div>
        )}

        {/* Map div */}
        <div
          ref={mapContainer}
          id="map-container"
          style={{
            width: "100%",
            height: "calc(100vh - 64px)",
          }}
        />
      </div>

      {/* ── Mobile bottom drawer ─────────────────────────────────────────────── */}
      <div className="md:hidden">
        {/* Toggle button */}
        <button
          onClick={() => setDrawerOpen((o) => !o)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: "var(--civic-blue)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-pill)",
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: "0.85rem",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <Filter size={15} strokeWidth={2} />
          Filters
        </button>

        {/* Drawer */}
        {drawerOpen && (
          <>
            {/* Overlay */}
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                zIndex: 55,
              }}
            />
            {/* Drawer panel */}
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 60,
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
                padding: "20px 20px 40px",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
                animation: "slideUp 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  <Filter size={16} color="var(--civic-blue)" />
                  Map Filters
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              {filtersPanel}
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button
                  onClick={() => setHeatmap((h) => !h)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid",
                    borderColor: heatmap ? "var(--civic-blue)" : "var(--border)",
                    background: heatmap ? "var(--civic-blue)" : "transparent",
                    color: heatmap ? "white" : "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Layers size={14} />
                  Heatmap
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 60,
          right: 20,
          zIndex: 40,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 14px",
          boxShadow: "var(--shadow-sm)",
        }}
        className="hidden md:block"
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Eye size={11} /> Legend
        </p>
        {[
          { label: "High Severity", color: "#D14545" },
          { label: "Medium Severity", color: "#E0A23B" },
          { label: "Low Severity", color: "#3E9C6B" },
          { label: "Resolved", color: "#94A3B8" },
        ].map((l) => (
          <div
            key={l.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: l.color,
                border: "2px solid white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {l.label}
            </span>
          </div>
        ))}

        {/* Stats row */}
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Total", value: issues.length },
              { label: "Filtered", value: filtered.length },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: "var(--civic-blue)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontWeight: 800,
                  fontSize: "1rem",
                  color: "var(--amber)",
                  lineHeight: 1,
                }}
              >
                {issues.filter((i) => i.severity === "high").length}
              </p>
              <p
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                High
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={12} color="var(--amber)" />
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Click a marker for details
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(62,156,107,0.7); }
          70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 6px rgba(62,156,107,0); }
          100% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(62,156,107,0); }
        }
        .pulse-dot {
          animation: pulse 1.8s infinite;
        }
        .maplibregl-ctrl-bottom-right {
          bottom: 70px !important;
        }
        .maplibregl-popup-close-button {
          font-size: 18px !important;
          padding: 4px 8px !important;
          color: #718096 !important;
        }
      `}</style>
    </div>
  );
}
