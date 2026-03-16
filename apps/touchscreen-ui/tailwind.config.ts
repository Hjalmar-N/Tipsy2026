import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        lime: "#c1ff72",
        cream: "#f6f0de"
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        tipsy: ["Libre Baskerville", "Georgia", "serif"],
        body: ["Trebuchet MS", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
