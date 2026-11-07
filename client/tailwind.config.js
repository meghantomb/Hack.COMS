/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pond: {
          deep: "#1a3a4a",
          mid: "#2d6a7a",
          light: "#7ec8c8",
          foam: "#d4f1f1",
          reed: "#4a7c59",
          sunset: "#e8a87c",
          ink: "#14232b",
        },
      },
      fontFamily: {
        display: ['"Fredoka"', "system-ui", "sans-serif"],
        story: ['"Nunito"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
