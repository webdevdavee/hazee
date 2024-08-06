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
        secondary: "#3a3b3c",
        accent: "#B9A6FD",
        base: "#181818",
      },
    },
  },
  plugins: [],
};
export default config;
