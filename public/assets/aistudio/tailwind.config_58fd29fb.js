/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        khmer: ['"Noto Sans Khmer"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcdbff',
          300: '#8ec4ff',
          400: '#59a2ff',
          500: '#327eff',
          600: '#1b5ff7',
          700: '#1347e4',
          800: '#153abb',
          900: '#163493',
          950: '#122159',
        },
      },
    },
  },
  plugins: [],
}
