import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          blue: "#2C6E8E",
          "blue-light": "#3D8CAF",
          "blue-dark": "#1E4F66",
        },
        amber: "#E0A23B",
        alert: "#D14545",
        ok: "#3E9C6B",
        base: "#FAFAF7",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "20px",
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        pulse: "pulse 2s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
