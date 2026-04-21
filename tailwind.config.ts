import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "sans-serif"],
        mono: ["SF Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "hud-score": ["13px", { lineHeight: "1", fontWeight: "700", letterSpacing: "-0.01em" }],
        "hud-label": ["10px", { lineHeight: "1", fontWeight: "500", letterSpacing: "0.04em" }],
        "hud-meta":  ["11px", { lineHeight: "1", fontWeight: "400" }],
      },
      colors: {
        hud: {
          bg:      "rgba(15, 15, 15, 0.82)",
          border:  "rgba(255,255,255,0.10)",
          text:    "#f0f0f0",
          muted:   "#888",
          accent:  "#34C759",   /* macOS green */
          warning: "#FF9F0A",   /* macOS amber */
          danger:  "#FF453A",   /* macOS red */
          blue:    "#0A84FF",
        },
      },
      borderRadius: {
        hud: "16px",
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease",
        "slide-down": "slideDown 0.2s ease",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
