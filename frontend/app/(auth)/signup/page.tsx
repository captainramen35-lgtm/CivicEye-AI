"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { Eye, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, name);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px 12px 40px",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    background: "var(--bg-base)",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--civic-blue)", fontWeight: 800, fontSize: "1.3rem", marginBottom: 8 }}>
            <Eye size={24} /> CivicEye
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Join the civic revolution</p>
        </div>

        {error && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(209,69,69,0.08)", border: "1px solid rgba(209,69,69,0.2)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: 20, color: "var(--red-alert)", fontSize: "0.875rem" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Full Name", value: name, onChange: setName, type: "text", placeholder: "Arjun Sharma", Icon: User },
            { label: "Email", value: email, onChange: setEmail, type: "email", placeholder: "you@example.com", Icon: Mail },
            { label: "Password", value: password, onChange: setPassword, type: "password", placeholder: "Min. 6 characters", Icon: Lock },
          ].map(({ label, value, onChange, type, placeholder, Icon }) => (
            <div key={label}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{label}</label>
              <div style={{ position: "relative" }}>
                <Icon size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type={type}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                  placeholder={placeholder}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--civic-blue)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button
          onClick={handleGoogle}
          style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "white", fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color 0.15s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--civic-blue)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--civic-blue)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
