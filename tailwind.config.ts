import type { Config } from "tailwindcss";

const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withAlpha("--background"),
        surface: withAlpha("--surface"),
        "surface-2": withAlpha("--surface-2"),
        elevated: withAlpha("--elevated"),
        foreground: withAlpha("--foreground"),
        muted: withAlpha("--muted"),
        border: withAlpha("--border"),
        "border-strong": withAlpha("--border-strong"),
        accent: {
          DEFAULT: withAlpha("--accent"),
          strong: withAlpha("--accent-strong"),
          soft: withAlpha("--accent-soft"),
          fg: withAlpha("--accent-fg"),
        },
        success: { DEFAULT: withAlpha("--success"), soft: withAlpha("--success-soft") },
        warning: { DEFAULT: withAlpha("--warning"), soft: withAlpha("--warning-soft") },
        danger: { DEFAULT: withAlpha("--danger"), soft: withAlpha("--danger-soft") },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "content-in": {
          from: { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "sheet-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "sheet-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "100% 0" }, "100%": { backgroundPosition: "0 0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease",
        "overlay-in": "overlay-in 0.2s ease",
        "content-in": "content-in 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in-right": "sheet-in-right 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in-left": "sheet-in-left 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.4s ease-in-out infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      fontSize: {
        display: ["3.25rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};
export default config;
