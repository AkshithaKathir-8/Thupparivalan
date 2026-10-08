/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0091B9',      // Primary Teal
          cyan: '#BAE4F0',      // Light Cyan
          deepblue: '#004E9B',  // Deep Blue
          orange: '#FF6500',    // Warning/Critical
          yellow: '#FFD500',    // Caution/Review
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
