import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Careem/Uber emerald
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          accent: "#00E58B",
        },
        dark: {
          950: "#07090E",
          900: "#0B0F17",
          850: "#101622",
          800: "#151D2C",
          750: "#1C2638",
          700: "#243247",
        },
      },
    },
  },
  plugins: [],
};

export default config;
