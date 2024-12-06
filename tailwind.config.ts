import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#334FEF",
        secondary: "#1a1a1a",
        secondaryhover: "#262626",
        accent: "#B9A6FD",
        base: "#0C0C0C",
        abstract: "#F44336",
      },
      animation: {
        "gradient-xy": "gradient-xy 3s ease infinite",
      },
      keyframes: {
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
    },
    screens: {
      ss: { max: "290px" },
      sm: { max: "320px" },
      m: { max: "767px" },
      xl: { min: "768px", max: "1024px" },
      xxl: { min: "1025px", max: "1279px" },
      xxxl: { min: "1280px" },
      ultra: { min: "1500px" },
    },
  },
  plugins: [],
};
export default config;
