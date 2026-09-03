import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ---- BRIEVV brand palette (spec §3) ----
        navy: {
          DEFAULT: "#0B2744", // dark navy
          deep: "#071A2D", // deep technical navy
          black: "#08111C", // near-black
        },
        paper: "#F4F1E8", // warm architectural paper
        ink: "#08111C",
        white: "#FFFFFF",
        orange: {
          DEFAULT: "#FF6A13", // technical orange (primary action)
          hover: "#D95408",
        },
        steel: "#657180", // technical gray
        success: "#24A36A",
        warning: "#E5A11A",
        danger: "#D64545",
        border: "rgba(8,17,28,0.12)",
        "border-dark": "rgba(244,241,232,0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
        lg: "10px",
        xl: "16px",
      },
      spacing: {
        "4.5": "1.125rem",
        18: "4.5rem",
        22: "5.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,17,28,0.06), 0 1px 1px rgba(8,17,28,0.04)",
        elevated: "0 8px 24px rgba(8,17,28,0.10), 0 2px 6px rgba(8,17,28,0.06)",
        focus: "0 0 0 3px rgba(255,106,19,0.35)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-500px 0" }, "100%": { backgroundPosition: "500px 0" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 1.8s linear infinite",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
