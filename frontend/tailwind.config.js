/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2c5282',
          DEFAULT: '#1a365d',
          dark: '#0f172a',
        },
        saffron: {
          DEFAULT: '#e67e22', // orange accent
          dark: '#d35400',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
