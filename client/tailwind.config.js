/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          50: "#f8f6ef",
          100: "#f2eddc",
          200: "#e2d5b0",
          300: "#ceb57b",
          400: "#bc9851",
          500: "#a78039",
          600: "#8a672d",
          700: "#684d24",
          800: "#49361b",
          900: "#302111"
        },
        field: {
          50: "#edf6f1",
          100: "#d2ead8",
          200: "#add7b8",
          300: "#82be92",
          400: "#5ea46f",
          500: "#418855",
          600: "#336d45",
          700: "#295638",
          800: "#22452f",
          900: "#1c3828"
        },
        lake: {
          50: "#eef8fb",
          100: "#d4edf6",
          200: "#aedde9",
          300: "#7cc9da",
          400: "#48adc2",
          500: "#2f8fa5",
          600: "#267485",
          700: "#225f6c",
          800: "#214f59",
          900: "#1f434c"
        }
      },
      boxShadow: {
        panel: "0 24px 80px rgba(28, 56, 40, 0.12)"
      }
    }
  },
  plugins: []
};

