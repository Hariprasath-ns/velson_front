/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: '#0097A7',
        'main-light': '#D4F1F4',
        'main-dark': '#007a87',
        accent: '#00BCD4',
        surface: '#ffffff',
        background: '#f8fafc',
        'text-main': '#1e293b',
        'text-muted': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
