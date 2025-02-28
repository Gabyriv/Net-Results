// Tailwind CSS configuration file to customize the default styles and enable dark mode via the 'class' strategy
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8', // A blue tone for primary buttons
        secondary: '#9333ea', // A purple tone for secondary actions
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  darkMode: 'class', // Enables dark mode
  plugins: [],
}
