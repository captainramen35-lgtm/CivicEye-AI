"use client";

import { useState } from "react";
import { ThumbsUp, AlertTriangle, Camera, LogIn, Shield } from "lucide-react";
import { User } from "firebase/auth";

interface VerifyPanelProps {
  issueId: string;
  currentUser: User | null;
  verificationCount: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type Toast = { id: number; message: string; type: "success" | "error" };

export default function VerifyPanel({
  issueId,
  currentUser,
  verificationCount: initialCount,
}: VerifyPanelProps) {
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState<"verify" | "incorrect" | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [userAction, setUserAction] = useState<"verify" | "incorrect" | null>(null);

  function addToast(message: string, type: "success" | "error") {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  async function handleAction(action: "verify" | "incorrect") {
    if (!currentUser) return;
    if (loading) return;
    setLoading(action);

    try {
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/verification/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: currentUser.uid,
          action: action === "incorrect" ? "reject" : "verify",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Request failed");
      }

      if (action === "verify") {
        setCount((c) => c + 1);
        setUserAction("verify");
        addToast("✓ Issue verified! Your report helps prioritize this fix.", "success");
      } else {
        setUserAction("incorrect");
        addToast("Flagged as incorrect. Our team will review this.", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      addToast(msg, "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(44,110,142,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield size={18} strokeWidth={2} color="var(--civic-blue)" />
        </div>
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--text-primary)",
            }}
          >
            Community Verification
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Your verifications help prioritize real issues
          </p>
        </div>
      </div>

      {/* Verification count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(62,156,107,0.06)",
          border: "1px solid rgba(62,156,107,0.2)",
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <ThumbsUp
          size={20}
          strokeWidth={2}
          color="var(--green-ok)"
          fill="rgba(62,156,107,0.15)"
        />
        <div>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--green-ok)",
              lineHeight: 1,
            }}
          >
            {count}
          </span>
          <span
            style={{
              marginLeft: 6,
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            {count === 1 ? "community verification" : "community verifications"}
          </span>
        </div>
        {count >= 5 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.7rem",
              fontWeight: 700,
              background: "rgba(62,156,107,0.12)",
              color: "#2A7A56",
              padding: "3px 10px",
              borderRadius: "var(--radius-pill)",
            }}
          >
            HIGH TRUST
          </span>
        )}
      </div>

      {/* Not logged in */}
      {!currentUser ? (
        <div
          style={{
            textAlign: "center",
            padding: "20px 16px",
            background: "rgba(44,110,142,0.04)",
            borderRadius: "var(--radius)",
            border: "1px dashed var(--border)",
          }}
        >
          <LogIn
            size={28}
            strokeWidth={1.5}
            color="var(--text-muted)"
            style={{ margin: "0 auto 10px" }}
          />
          <p
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            Sign in to verify
          </p>
          <p
            style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 14 }}
          >
            Help your community by verifying civic issues
          </p>
          <a href="/login">
            <button
              className="btn-primary"
              style={{ padding: "9px 22px", fontSize: "0.85rem" }}
            >
              Sign In
            </button>
          </a>
        </div>
      ) : (
        <>
          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => handleAction("verify")}
              disabled={!!loading || userAction === "verify"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                borderRadius: "var(--radius-pill)",
                border: "none",
                background:
                  userAction === "verify"
                    ? "rgba(62,156,107,0.15)"
                    : "linear-gradient(135deg, var(--green-ok), #4ab87e)",
                color: userAction === "verify" ? "var(--green-ok)" : "white",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor:
                  loading || userAction === "verify"
                    ? "not-allowed"
                    : "pointer",
                opacity: loading === "verify" ? 0.7 : 1,
                transition: "all 0.2s ease",
                boxShadow:
                  userAction === "verify"
                    ? "none"
                    : "0 4px 14px rgba(62,156,107,0.35)",
              }}
            >
              <ThumbsUp size={16} strokeWidth={2} />
              {loading === "verify"
                ? "Verifying…"
                : userAction === "verify"
                ? "Verified ✓"
                : "Verify Issue"}
            </button>

            <button
              onClick={() => handleAction("incorrect")}
              disabled={!!loading || userAction === "incorrect"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                borderRadius: "var(--radius-pill)",
                border:
                  userAction === "incorrect"
                    ? "2px solid var(--red-alert)"
                    : "2px solid var(--red-alert)",
                background:
                  userAction === "incorrect"
                    ? "rgba(209,69,69,0.1)"
                    : "transparent",
                color: "var(--red-alert)",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor:
                  loading || userAction === "incorrect"
                    ? "not-allowed"
                    : "pointer",
                opacity: loading === "incorrect" ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              <AlertTriangle size={16} strokeWidth={2} />
              {loading === "incorrect"
                ? "Flagging…"
                : userAction === "incorrect"
                ? "Flagged"
                : "Report Incorrect"}
            </button>
          </div>

          {/* Evidence upload */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Camera size={14} strokeWidth={2} />
              Add Evidence (optional)
            </p>
            <label
              htmlFor="evidence-upload"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                border: "1px dashed var(--border)",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                background: evidenceFile
                  ? "rgba(44,110,142,0.04)"
                  : "transparent",
                transition: "background 0.15s ease",
              }}
            >
              <Camera size={16} strokeWidth={1.5} color="var(--text-muted)" />
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {evidenceFile
                  ? evidenceFile.name
                  : "Upload a photo to support your verification"}
              </span>
              <input
                id="evidence-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Trust score context */}
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            Your verifications build your trust score and help issues get
            resolved faster.
          </p>
        </>
      )}

      {/* Toast notifications */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius)",
              background:
                t.type === "success"
                  ? "rgba(62,156,107,0.95)"
                  : "rgba(209,69,69,0.95)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.87rem",
              boxShadow: "var(--shadow-lg)",
              backdropFilter: "blur(8px)",
              animation: "toastSlideIn 0.25s ease",
              maxWidth: 340,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
