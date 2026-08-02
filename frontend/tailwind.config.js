/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#82abff",
          400: "#4f7fff",
          500: "#2e5aff",
          600: "#1e40e6",
          700: "#1730b3",
          800: "#152a8f",
          900: "#152a6b",
        },
      },
    },
  },
  plugins: [],
};
