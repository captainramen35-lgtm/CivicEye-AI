import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: "CivicEye AI — Report. Verify. Resolve.",
  description: "AI-powered hyperlocal civic issue reporting. Upload a photo, let Gemini classify the issue, track resolution on a live map.",
  keywords: ["civic reporting", "pothole", "municipal issues", "AI", "community"],
  openGraph: {
    title: "CivicEye AI",
    description: "AI-powered hyperlocal civic issue reporting platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
