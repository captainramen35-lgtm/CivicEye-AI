"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Map,
  ExternalLink,
  Sparkles,
  Search,
  UploadCloud,
  FileImage,
  BrainCircuit,
  ClipboardCheck,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { analyzeImage, createIssue, checkDuplicate } from "@/lib/api";
import { storage } from "@/lib/firebaseClient";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import ImageUploader from "@/components/report/ImageUploader";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Road Damage",
  "Water Leakage",
  "Waste Management",
  "Streetlight Failure",
  "Drainage Issues",
  "Public Safety Concerns",
  "Infrastructure Damage",
];

const DEPARTMENTS = [
  "Roads Department",
  "Water Board",
  "Sanitation Department",
  "Electricity Board",
  "Public Works Department",
];

const SEVERITIES = ["low", "medium", "high"];

// ─── Confetti ────────────────────────────────────────────────────────────────
function Confetti() {
  const PIECES = Array.from({ length: 32 }, (_, i) => i);
  const colors = ["#2C6E8E", "#3D8CAF", "#3E9C6B", "#E0A23B", "#D14545", "#a855f7"];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {PIECES.map((i) => {
        const color = colors[i % colors.length];
        const left = `${(i * 3.125) % 100}%`;
        const delay = `${(i * 0.1) % 1.5}s`;
        const size = 5 + (i % 6);
        const shape = i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: -20,
              left,
              width: size,
              height: size + (i % 4) * 3,
              background: color,
              borderRadius: shape,
              opacity: 0,
              animation: `confetti-fall 2.2s ${delay} cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(340px) rotate(${Math.random() * 720}deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Header Navigation ────────────────────────────────────────────────────────
function ReportFloatingNav({ user }: { user: any }) {
  const { logout } = useAuth();
  return (
    <nav
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 40px)",
        maxWidth: 680,
        height: 64,
        background: "rgba(250, 250, 247, 0.8)",
        backdropFilter: "blur(12px)",
        borderRadius: "var(--radius-pill)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 1000,
      }}
    >
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
        }}
      >
        <Eye size={20} strokeWidth={2.5} />
        CivicEye
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/map" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none" }}>
          Live Map
        </Link>
        <Link href="/dashboard" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", textDecoration: "none" }}>
          Dashboard
        </Link>
        <button
          onClick={logout}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--red-alert)",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Route protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Stepper state: 0 = Capture, 1 = AI Analysis, 2 = Confirm, 3 = Done
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Form payload states
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Geolocation & Manual Address
  const [geoState, setGeoState] = useState<{
    lat: number | null;
    lng: number | null;
    address: string;
    loading: boolean;
    error: string | null;
  }>({
    lat: null,
    lng: null,
    address: "",
    loading: false,
    error: null,
  });

  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);

  // Image Upload Progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // AI Classification states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    issue_type: string;
    severity: "low" | "medium" | "high";
    risk_notes: string;
    department: string;
    category: string;
    confidence: number;
  } | null>(null);
  const [aiFailed, setAiFailed] = useState(false);
  const [loadingText, setLoadingText] = useState("Detecting issue type...");

  // Duplicate Check states
  const [dupCheckResult, setDupCheckResult] = useState<{
    is_duplicate: boolean;
    existing_issue_id?: string;
    similarity_score?: number;
  } | null>(null);

  // Submission & Success states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    id: string;
    priority_score: number;
    status: string;
  } | null>(null);
  const [badgeUnlocked, setBadgeUnlocked] = useState<string | null>(null);

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  // ── Address Geocoding Lookups ──────────────────────────────────────────────
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { "User-Agent": "CivicEyeAI/1.0 (civic-reporting-app)" }
      });
      if (res.ok) {
        const data = await res.json();
        const displayName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setGeoState((prev) => ({ ...prev, address: displayName }));
      }
    } catch {
      setGeoState((prev) => ({ ...prev, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
    }
  };

  const triggerGeolocation = () => {
    setGeoState((prev) => ({ ...prev, loading: true, error: null }));
    if (!navigator.geolocation) {
      setGeoState((prev) => ({ ...prev, loading: false, error: "not_supported" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGeoState({
          lat,
          lng,
          address: "Fetching address...",
          loading: false,
          error: null,
        });
        fetchAddress(lat, lng);
      },
      (error) => {
        setGeoState((prev) => ({ ...prev, loading: false, error: "denied" }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualSearch = async () => {
    if (!addressSearchQuery.trim()) return;
    setSearchingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearchQuery)}&limit=1`, {
        headers: { "User-Agent": "CivicEyeAI/1.0 (civic-reporting-app)" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          setGeoState({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name,
            loading: false,
            error: null,
          });
        } else {
          setGeoState((prev) => ({ ...prev, error: "Location not found. Please try another address." }));
        }
      }
    } catch {
      setGeoState((prev) => ({ ...prev, error: "Failed to connect to search service." }));
    } finally {
      setSearchingAddress(false);
    }
  };

  // ── Image Selection Handler ────────────────────────────────────────────────
  const handleImageSelect = (base64: string, file: File) => {
    setImageBase64(base64);
    setImageFile(file);
    triggerGeolocation();
  };

  const handleRetake = () => {
    setImageBase64(null);
    setImageFile(null);
    setGeoState({
      lat: null,
      lng: null,
      address: "",
      loading: false,
      error: null,
    });
  };

  // ── Rotating Microcopy during AI Scan ──────────────────────────────────────
  useEffect(() => {
    if (aiLoading) {
      const texts = [
        "Detecting issue type...",
        "Assessing severity...",
        "Identifying department...",
        "Scanning for duplicate reports...",
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [aiLoading]);

  // ── Parallel Photo Upload & AI Request ─────────────────────────────────────
  const uploadPhoto = async (): Promise<string> => {
    if (!imageBase64 || !user) throw new Error("Missing image or authentication");
    
    // Animate custom upload bar
    let currentProg = 0;
    const progressInterval = setInterval(() => {
      currentProg += 8;
      if (currentProg > 92) clearInterval(progressInterval);
      setUploadProgress(Math.min(currentProg, 92));
    }, 200);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        clearInterval(progressInterval);
        reject(new Error("Upload timeout"));
      }, 5000)
    );

    const uploadTask = (async () => {
      const uuid = crypto.randomUUID();
      const storageRef = ref(storage, `issues/${user.uid}/${uuid}.jpg`);
      await uploadString(storageRef, imageBase64, "base64", {
        contentType: imageFile?.type || "image/jpeg",
      });
      const downloadUrl = await getDownloadURL(storageRef);
      clearInterval(progressInterval);
      setUploadProgress(100);
      return downloadUrl;
    })();

    try {
      const url = await Promise.race([uploadTask, timeoutPromise]);
      setUploadedUrl(url);
      return url;
    } catch (e) {
      console.warn("Storage upload failed/timed out, using local fallback base64.", e);
      clearInterval(progressInterval);
      setUploadProgress(100);
      const prefix = `data:${imageFile?.type || "image/jpeg"};base64,`;
      const fallbackUrl = imageBase64.startsWith("data:") ? imageBase64 : `${prefix}${imageBase64}`;
      setUploadedUrl(fallbackUrl);
      return fallbackUrl;
    }
  };

  const startAnalysis = async () => {
    if (!imageBase64) return;
    setStep(1); // Move to Stepper 2: AI Analysis
    setAiLoading(true);
    setAiFailed(false);

    // Parallel calls: Upload Image + Run Gemini Analysis
    const uploadPromise = uploadPhoto();
    const analyzePromise = analyzeImage(imageBase64);

    try {
      const [photoUrl, result] = await Promise.all([uploadPromise, analyzePromise]);
      setAiResult(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiFailed(true);
      // Fallback empty schema so user can fill manually
      setAiResult({
        issue_type: "",
        severity: "low",
        risk_notes: "Could not assess risk automatically.",
        department: DEPARTMENTS[0],
        category: CATEGORIES[0],
        confidence: 0.0,
      });
    } finally {
      setAiLoading(false);
    }
  };

  // ── Step 3 Transitions & Duplicate Verification ──────────────────────────
  const transitionToConfirm = async () => {
    setStep(2); // Move to Stepper 3: Confirm details
    if (!geoState.lat || !geoState.lng || !aiResult) return;
    
    // Silently check duplicate
    try {
      const dup = await checkDuplicate({
        lat: geoState.lat,
        lng: geoState.lng,
        issue_type: aiResult.issue_type,
        category: aiResult.category,
      });
      setDupCheckResult({
        is_duplicate: dup.is_duplicate,
        existing_issue_id: dup.existing_issue_id,
        similarity_score: dup.similarity_score,
      });
    } catch {
      // Non-fatal
    }
  };

  // Mapbox/MapLibre Initialization on Confirm Step
  useEffect(() => {
    if (step === 2 && mapContainerRef.current && geoState.lat && geoState.lng) {
      if (mapRef.current) {
        mapRef.current.remove();
      }
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [geoState.lng, geoState.lat],
        zoom: 15,
        interactive: false,
      });

      new maplibregl.Marker({ color: "#2C6E8E" })
        .setLngLat([geoState.lng, geoState.lat])
        .addTo(map);

      mapRef.current = map;
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [step, geoState.lat, geoState.lng]);

  // ── Final Submission ───────────────────────────────────────────────────────
  const submitFinalReport = async (description = "") => {
    if (!aiResult || !geoState.lat || !geoState.lng || !user) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createIssue({
        reporter_id: user.uid,
        photo_url: uploadedUrl || "",
        lat: geoState.lat,
        lng: geoState.lng,
        address: geoState.address,
        issue_type: aiResult.issue_type || "Unspecified issue",
        severity: aiResult.severity,
        risk_notes: aiResult.risk_notes,
        department: aiResult.department,
        category: aiResult.category,
        confidence: aiResult.confidence,
        description,
      });

      setSubmitResult(res);
      
      // Simulating a badge check (e.g. priority unlocks first badge)
      if (res.id) {
        setBadgeUnlocked("Community Reporter");
      }
      setStep(3); // Stepper 4: Done
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF7" }}>
        <Loader2 size={32} color="#2C6E8E" className="animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF7", color: "#1F2937", fontFamily: "var(--font-body)" }}>
      {/* ── Navbar ── */}
      <ReportFloatingNav user={user} />

      {/* ── Main content ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "120px 20px 80px" }}>
        
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: "9999px",
              background: "rgba(44,110,142,0.06)",
              border: "1px solid rgba(44,110,142,0.18)",
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} color="#2C6E8E" />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#2C6E8E" }}>
              Hyperlocal Civic reporting
            </span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1F2937", letterSpacing: "-0.03em" }}>
            Report a Civic Issue
          </h1>
          <p style={{ marginTop: 8, fontSize: "0.95rem", color: "#4B5563" }}>
            Snap a photo, drop a pin, and watch your city respond.
          </p>
        </div>

        {/* ── Stepper Indicator ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 36 }}>
          {["Capture", "AI Analysis", "Confirm Details", "Done"].map((label, idx) => {
            const isActive = step === idx;
            const isDone = step > idx;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isDone ? "#3E9C6B" : isActive ? "#2C6E8E" : "#E5E7EB",
                      color: isActive || isDone ? "#FFF" : "#9CA3AF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      boxShadow: isActive ? "0 0 0 4px rgba(44,110,142,0.15)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#2C6E8E" : isDone ? "#3E9C6B" : "#9CA3AF",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    style={{
                      width: 48,
                      height: 2,
                      background: isDone ? "#3E9C6B" : "#E5E7EB",
                      margin: "0 8px 18px",
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ════════ STEP 1: Capture ════════ */}
        {step === 0 && (
          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", padding: 28, boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4, color: "#1F2937" }}>
              Upload Image
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: 20 }}>
              Take a photo or drag-and-drop file to initialize analysis.
            </p>

            <ImageUploader onImageSelect={handleImageSelect} />

            {/* Geolocation Section */}
            {imageBase64 && (
              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 8,
                  background: geoState.error ? "rgba(209,69,69,0.04)" : "#F9FAFB",
                  border: geoState.error ? "1px solid rgba(209,69,69,0.2)" : "1px solid #E5E7EB",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: geoState.error ? "rgba(209,69,69,0.1)" : "rgba(44,110,142,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {geoState.loading ? (
                      <Loader2 size={16} className="animate-spin" color="#2C6E8E" />
                    ) : geoState.error ? (
                      <AlertCircle size={16} color="#D14545" />
                    ) : (
                      <MapPin size={16} color="#2C6E8E" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                      {geoState.loading ? "Locating you..." : geoState.error ? "Location manually required" : "📍 Location Captured"}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {geoState.loading ? "Retrieving GPS coordinates..." : geoState.address || "Please enter coordinates."}
                    </p>
                  </div>
                </div>

                {/* Manual Address Input fallback */}
                {(geoState.error || !geoState.lat) && !geoState.loading && (
                  <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Enter street address or landmarks..."
                      value={addressSearchQuery}
                      onChange={(e) => setAddressSearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        fontSize: "0.82rem",
                        borderRadius: "6px",
                        border: "1px solid #D1D5DB",
                      }}
                    />
                    <button
                      onClick={handleManualSearch}
                      disabled={searchingAddress}
                      style={{
                        padding: "8px 14px",
                        background: "#2C6E8E",
                        color: "white",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {searchingAddress ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                      Search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Next Action Button */}
            {imageBase64 && (
              <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={startAnalysis}
                  disabled={geoState.loading || (!geoState.lat && !addressSearchQuery)}
                  className="btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 28px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                  }}
                >
                  Analyze with AI <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════ STEP 2: AI Analysis (Scan / Edit) ════════ */}
        {step === 1 && (
          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", padding: 28, boxShadow: "var(--shadow-sm)" }}>
            
            {/* AI Loading Scanner */}
            {aiLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(44,110,142,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    position: "relative",
                  }}
                >
                  <BrainCircuit size={36} color="#2C6E8E" className="animate-pulse" />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "2.5px solid transparent",
                      borderTopColor: "#2C6E8E",
                      animation: "spin 1.2s linear infinite",
                    }}
                  />
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#374151" }}>
                  AI Scanning Photo
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", marginTop: 6 }}>
                  {loadingText}
                </p>

                {/* Progress bar */}
                <div style={{ width: "60%", height: 4, background: "#E5E7EB", borderRadius: 2, margin: "20px auto 0", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      background: "#2C6E8E",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ) : (
              /* Classification Result Cards */
              <div>
                {aiFailed && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 16px",
                      background: "rgba(209,69,69,0.06)",
                      border: "1px solid rgba(209,69,69,0.2)",
                      borderRadius: 8,
                      marginBottom: 20,
                    }}
                  >
                    <AlertCircle size={16} color="#D14545" />
                    <p style={{ fontSize: "0.82rem", color: "#A52D2D", fontWeight: 500 }}>
                      AI couldn&apos;t analyze this — no worries, just fill in the details below manually.
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <BrainCircuit size={20} color="#2C6E8E" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    AI Analysis Result
                  </h3>
                  {!aiFailed && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "rgba(62,156,107,0.1)", color: "#3E9C6B", padding: "2px 8px", borderRadius: "9999px", marginLeft: "auto" }}>
                      {Math.round(aiResult!.confidence * 100)}% CONFIDENCE
                    </span>
                  )}
                </div>

                {/* Editable Preview Fields */}
                {aiResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {/* Category Selector */}
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Category
                      </label>
                      <select
                        value={aiResult.category}
                        onChange={(e) => setAiResult({ ...aiResult, category: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          fontSize: "0.88rem",
                        }}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Issue Type Input */}
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Issue Type / Short Title
                      </label>
                      <input
                        type="text"
                        value={aiResult.issue_type}
                        onChange={(e) => setAiResult({ ...aiResult, issue_type: e.target.value })}
                        placeholder="e.g. Pothole, Broken Streetlight..."
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          fontSize: "0.88rem",
                        }}
                      />
                    </div>

                    {/* Severity Pills Selector */}
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Severity
                      </label>
                      <div style={{ display: "flex", gap: 12 }}>
                        {SEVERITIES.map((sev) => {
                          const isSel = aiResult.severity === sev;
                          const color =
                            sev === "high" ? "#D14545" : sev === "medium" ? "#E0A23B" : "#3E9C6B";
                          return (
                            <button
                              key={sev}
                              onClick={() => setAiResult({ ...aiResult, severity: sev as any })}
                              style={{
                                flex: 1,
                                padding: "10px 0",
                                borderRadius: 8,
                                border: isSel ? `2px solid ${color}` : "1.5px solid #E5E7EB",
                                background: isSel ? `rgba(${sev === "high" ? "209,69,69" : sev === "medium" ? "224,162,59" : "62,156,107"}, 0.08)` : "transparent",
                                color,
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                transition: "all 0.25s ease",
                              }}
                            >
                              {sev}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Risk notes (readonly italic callout) */}
                    <div style={{ padding: "14px 16px", background: "rgba(224,162,59,0.06)", borderLeft: "4px solid #E0A23B", borderRadius: "0 8px 8px 0" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#C07E23", textTransform: "uppercase", display: "block", marginBottom: 2 }}>
                        AI Risk Assessment
                      </span>
                      <p style={{ fontSize: "0.82rem", fontStyle: "italic", color: "#5C6F7E" }}>
                        {aiResult.risk_notes}
                      </p>
                    </div>

                    {/* Department Dropdown */}
                    <div>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Responsible Department
                      </label>
                      <select
                        value={aiResult.department}
                        onChange={(e) => setAiResult({ ...aiResult, department: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid #D1D5DB",
                          fontSize: "0.88rem",
                        }}
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between" }}>
                  <button
                    onClick={handleRetake}
                    className="btn-outline"
                    style={{ padding: "12px 24px", borderRadius: "9999px", fontSize: "0.88rem", fontWeight: 600 }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={transitionToConfirm}
                    className="btn-primary"
                    disabled={!aiResult || !aiResult.issue_type}
                    style={{ padding: "12px 28px", borderRadius: "9999px", fontSize: "0.88rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    Confirm Details <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════ STEP 3: Confirm Details ════════ */}
        {step === 2 && aiResult && (
          <div style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #E5E7EB", padding: 28, boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 4, color: "#1F2937" }}>
              Verify & Submit
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: 20 }}>
              Verify all details before submitting to municipal services.
            </p>

            {/* Duplicate Check Banner */}
            {dupCheckResult?.is_duplicate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  background: "rgba(224,162,59,0.06)",
                  border: "1px solid rgba(224,162,59,0.25)",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={18} color="#E0A23B" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#C07E23" }}>
                    Potential Duplicate Found
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 4, lineHeight: 1.4 }}>
                    We found a similar report nearby. Submitting will add your verification to it instead of creating a new one.
                  </p>
                  {dupCheckResult.existing_issue_id && (
                    <Link
                      href={`/issue/${dupCheckResult.existing_issue_id}`}
                      target="_blank"
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#2C6E8E",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 8,
                      }}
                    >
                      View existing report <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Summary Row */}
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              {/* Thumbnail */}
              <div style={{ width: 120, height: 120, borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadedUrl || ""}
                  alt="Issue thumbnail"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Details column */}
              <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 6 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1F2937" }}>
                  {aiResult.issue_type}
                </h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, background: "#E5E7EB", padding: "2px 8px", borderRadius: 4 }}>
                    {aiResult.category}
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      background:
                        aiResult.severity === "high"
                          ? "rgba(209,69,69,0.1)"
                          : aiResult.severity === "medium"
                          ? "rgba(224,162,59,0.1)"
                          : "rgba(62,156,107,0.1)",
                      color:
                        aiResult.severity === "high"
                          ? "#D14545"
                          : aiResult.severity === "medium"
                          ? "#E0A23B"
                          : "#3E9C6B",
                      padding: "2px 8px",
                      borderRadius: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    {aiResult.severity}
                  </span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: 4 }}>
                  🏢 {aiResult.department}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  📍 {geoState.address}
                </p>
              </div>
            </div>

            {/* Embedded Read-only Map */}
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: 180,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                marginBottom: 20,
                overflow: "hidden",
              }}
            />

            {/* Optional Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="Add any extra detail (optional) or landmarks..."
                style={{
                  width: "100%",
                  height: 80,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  fontSize: "0.88rem",
                  resize: "none",
                }}
                id="report-desc-field"
              />
            </div>

            {submitError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  background: "rgba(209,69,69,0.06)",
                  border: "1px solid rgba(209,69,69,0.2)",
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={16} color="#D14545" />
                <p style={{ fontSize: "0.82rem", color: "#A52D2D", fontWeight: 500 }}>
                  {submitError}
                </p>
              </div>
            )}

            {/* Submit Action row */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => setStep(1)}
                className="btn-outline"
                style={{ padding: "12px 24px", borderRadius: "9999px", fontSize: "0.88rem", fontWeight: 600 }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  const desc = (document.getElementById("report-desc-field") as HTMLTextAreaElement)?.value || "";
                  submitFinalReport(desc);
                }}
                disabled={submitting}
                className="btn-primary"
                style={{
                  padding: "12px 32px",
                  borderRadius: "9999px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Report <ClipboardCheck size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════ STEP 4: Success / Done ════════ */}
        {step === 3 && submitResult && (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              border: "1.5px solid rgba(62,156,107,0.35)",
              boxShadow: "var(--shadow-md)",
              padding: "40px 32px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Confetti />

            {/* Animate Check icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(62,156,107,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                animation: "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <CheckCircle2 size={38} color="#3E9C6B" />
            </div>

            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1F2937", marginBottom: 8 }}>
              Report Submitted! 🎉
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#6B7280", maxWidth: 420, margin: "0 auto 28px", lineHeight: 1.6 }}>
              Thank you for making your city better. The relevant department has been notified.
            </p>

            {/* Meta badge block */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
              <div style={{ padding: "6px 12px", background: "#F3F4F6", borderRadius: 6, fontSize: "0.8rem", color: "#4B5563" }}>
                ID: <strong>#{submitResult.id.slice(0, 8)}</strong>
              </div>
              <div style={{ padding: "6px 12px", background: "rgba(44,110,142,0.1)", borderRadius: 6, fontSize: "0.8rem", color: "#2C6E8E" }}>
                Priority Score: <strong>{Math.round(submitResult.priority_score)}/100</strong>
              </div>
            </div>

            {/* Badge Unlocked Toast Alert */}
            {badgeUnlocked && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, rgba(224,162,59,0.1), rgba(224,162,59,0.02))",
                  border: "1px solid rgba(224,162,59,0.3)",
                  borderRadius: 8,
                  marginBottom: 32,
                  textAlign: "left",
                  animation: "pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.5s both",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E0A23B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trophy size={18} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#C07E23" }}>
                    Badge Earned!
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: 2 }}>
                    You earned the <strong>{badgeUnlocked}</strong> badge for reporting!
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setStep(0);
                  handleRetake();
                }}
                className="btn-outline"
                style={{ padding: "12px 24px", borderRadius: "9999px", fontSize: "0.88rem", fontWeight: 600 }}
              >
                Report Another
              </button>
              <Link href={`/issue/${submitResult.id}`} style={{ textDecoration: "none" }}>
                <button
                  className="btn-primary"
                  style={{
                    padding: "12px 28px",
                    borderRadius: "9999px",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Track Issue <ExternalLink size={14} />
                </button>
              </Link>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
