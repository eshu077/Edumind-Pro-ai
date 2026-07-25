import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "#0B1120",
        surface: "#111A2E",
        muted: "#1B2436",
        border: "#243049",
        foreground: "#F5F7FA",
        subtle: "#93A1B8",
        accent: {
          DEFAULT: "#F5A623",
          foreground: "#0B1120",
        },
        violet: {
          DEFAULT: "#7C6CF0",
          foreground: "#F5F7FA",
        },
        success: "#3DDC97",
        danger: "#F0577B",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "highlight-sweep": {
          "0%": { backgroundSize: "0% 0.42em" },
          "100%": { backgroundSize: "100% 0.42em" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "highlight-sweep": "highlight-sweep 1.1s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
