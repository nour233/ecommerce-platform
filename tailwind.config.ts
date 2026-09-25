import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18212f",
        moss: "#3f5f46",
        clay: "#bd6d48",
        cream: "#f7f1e8",
        linen: "#fbf8f2"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(24, 33, 47, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
