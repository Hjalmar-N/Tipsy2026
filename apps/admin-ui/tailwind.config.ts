import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slatepaper: "#ece8de",
        ember: "#d95d39",
        midnight: "#13293d"
      },
      fontFamily: {
        display: ["Palatino Linotype", "serif"],
        body: ["Verdana", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
