import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutral surface scale
        canvas: "#f7f8fa",
        panel: "#ffffff",
        line: "#e6e8ec",
        soft: "#eef2f5",
        // Text
        ink: "#101828",
        muted: "#667085",
        faint: "#98a2b3",
        // Single accent (deep teal-green, Heptapus brand-leaning)
        brand: {
          DEFAULT: "#0e7c66",
          dark: "#0a5e4d",
          soft: "#e7f4f0",
          ring: "#0e7c6633"
        },
        // Back-compat alias used by some older markup
        brandDark: "#0a5e4d",
        sidebar: {
          DEFAULT: "#0f1a17",
          hover: "#1a2a25",
          active: "#16332b",
          text: "#a7b4b0",
          textActive: "#ffffff"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)",
        cardHover: "0 4px 12px -2px rgba(16, 24, 40, 0.10)"
      },
      borderRadius: {
        xl: "0.875rem"
      }
    }
  },
  plugins: []
};

export default config;
