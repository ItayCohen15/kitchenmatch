/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heebo: ['Heebo', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fdf8ee',
          100: '#faefd0',
          200: '#f5db98',
          300: '#f0c460',
          400: '#ebb030',
          500: '#e8a020',
          600: '#c8841a',
          700: '#a06614',
          800: '#7a4d10',
          900: '#5a380c',
        },
        km: {
          dark:  '#0d1420',
          navy:  '#1a2744',
          gold:  '#e8a020',
          'gold-light': '#f0b832',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
