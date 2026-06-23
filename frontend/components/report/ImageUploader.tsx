"use client";

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { Camera, Upload, X, RefreshCw, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageSelect: (base64: string, file: File) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageUploader({ onImageSelect, disabled = false }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Strip the data URL prefix to get pure base64
        const base64 = result.split(",")[1];
        setPreview(result);
        setFileInfo({ name: file.name, size: file.size, type: file.type });
        onImageSelect(base64, file);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const extensionFromMime = (mime: string) => {
    const map: Record<string, string> = {
      "image/jpeg": "JPEG",
      "image/png": "PNG",
      "image/webp": "WebP",
      "image/heic": "HEIC",
      "image/gif": "GIF",
    };
    return map[mime] || mime.split("/")[1]?.toUpperCase() || "IMAGE";
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!preview ? (
        /* ── Drop Zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          style={{
            minHeight: 220,
            border: `2px dashed ${isDragging ? "var(--civic-blue)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            background: isDragging
              ? "rgba(44,110,142,0.05)"
              : disabled
              ? "rgba(0,0,0,0.02)"
              : "var(--bg-card)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
            boxShadow: isDragging ? "0 0 0 4px rgba(44,110,142,0.12)" : "none",
            position: "relative",
            overflow: "hidden",
          }}
          role="button"
          aria-label="Upload photo — click or drag an image here"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(44,110,142,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              pointerEvents: "none",
            }}
          />

          {/* Icon cluster */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius)",
                background: isDragging
                  ? "rgba(44,110,142,0.15)"
                  : "rgba(44,110,142,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              <Upload
                size={26}
                strokeWidth={2}
                color={isDragging ? "var(--civic-blue)" : "var(--text-muted)"}
              />
            </div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "var(--radius)",
                background: isDragging
                  ? "rgba(44,110,142,0.15)"
                  : "rgba(44,110,142,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
            >
              <ImageIcon
                size={26}
                strokeWidth={2}
                color={isDragging ? "var(--civic-blue)" : "var(--text-muted)"}
              />
            </div>
          </div>

          {/* Text */}
          <div style={{ textAlign: "center", position: "relative" }}>
            <p
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                color: isDragging ? "var(--civic-blue)" : "var(--text-primary)",
                marginBottom: 4,
                transition: "color 0.2s ease",
              }}
            >
              {isDragging ? "Drop your photo here" : "Drag & drop a photo"}
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              or click to browse your files
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
              Supports JPEG, PNG, WebP, HEIC
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "70%",
              position: "relative",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Take Photo button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) cameraInputRef.current?.click();
            }}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              borderRadius: "var(--radius-pill)",
              border: "2px solid var(--civic-blue)",
              background: "transparent",
              color: "var(--civic-blue)",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background 0.15s ease, color 0.15s ease",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--civic-blue)";
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--civic-blue)";
            }}
          >
            <Camera size={16} strokeWidth={2} />
            Take Photo
          </button>
        </div>
      ) : (
        /* ── Preview ── */
        <div
          style={{
            borderRadius: "var(--radius-lg)",
            border: "2px solid var(--border)",
            overflow: "hidden",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* Image preview */}
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview of selected image"
              style={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                display: "block",
              }}
            />

            {/* Processing overlay */}
            {isProcessing && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "3px solid var(--border)",
                    borderTopColor: "var(--civic-blue)",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            )}

            {/* Remove button overlay */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              title="Remove photo"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(209,69,69,0.85)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)";
              }}
            >
              <X size={16} strokeWidth={2} color="white" />
            </button>
          </div>

          {/* File info bar */}
          {fileInfo && (
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius)",
                    background: "rgba(44,110,142,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ImageIcon size={18} strokeWidth={2} color="var(--civic-blue)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 200,
                    }}
                  >
                    {fileInfo.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {extensionFromMime(fileInfo.type)} · {formatBytes(fileInfo.size)}
                  </p>
                </div>
              </div>

              {/* Retry / change */}
              <button
                type="button"
                onClick={() => !disabled && fileInputRef.current?.click()}
                disabled={disabled}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: "1.5px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  cursor: disabled ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--civic-blue)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--civic-blue)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                <RefreshCw size={13} strokeWidth={2} />
                Change
              </button>
            </div>
          )}
        </div>
      )}

      {/* Spin keyframe (injected inline for portability) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
