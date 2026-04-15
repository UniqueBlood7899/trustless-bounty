import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "algo-teal": "#00D4BA",
        "algo-teal-dim": "rgba(0,212,186,0.15)",
        "bg-base": "#0A0E1A",
        surface: "rgba(255,255,255,0.05)",
        "border-glass": "rgba(255,255,255,0.08)",
        "text-primary": "#F0F4FF",
        "text-secondary": "rgba(240,244,255,0.55)",
        "text-muted": "rgba(240,244,255,0.35)",
        "color-error": "#FF5B5B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
        btn: "8px",
      },
      backdropBlur: {
        glass: "12px",
        nav: "20px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.4)",
        "glass-hover": "0 12px 40px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
