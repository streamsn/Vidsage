import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Warm caramel/toffee accent — replaces the old indigo/violet brand color.
        brand: {
          50: "#FAF4EC",
          100: "#F3E4CF",
          200: "#E7C9A0",
          300: "#D8AB70",
          400: "#C68F4E",
          500: "#AE753A",
          600: "#8F5C2C",
          700: "#6E4622",
          800: "#52341A",
          900: "#3A2412",
        },
      },
      boxShadow: {
        glow: "0 8px 30px -8px rgba(143, 92, 44, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
