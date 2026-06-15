import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#64748b",
        line: "#e2e8f0",
        brand: "#0f766e",
        brandDark: "#134e4a",
        accent: "#c2410c",
        panel: "#ffffff",
        canvas: "#f7faf9",
        soft: "#eef7f5"
      }
    }
  },
  plugins: []
};

export default config;
