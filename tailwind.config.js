
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    
    extend: {
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        ink: "#10172A",
        accent: "#6D5DFC",
      },
      boxShadow: {
        card: "0 16px 50px rgba(20, 28, 55, 0.07)",
      },
    },
  },
  plugins: [],
};