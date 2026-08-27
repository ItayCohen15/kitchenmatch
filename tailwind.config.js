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
          navy:  '#12203a',
          gold:  '#e8a020',
          'gold-light': '#f0b832',
        },
      },
      borderRadius: {
        card: '16px',
        ctrl: '12px',
        tile: '14px',
      },
      boxShadow: {
        // Neutral, believable elevation — no colored glow
        sm:   '0 1px 2px rgba(20,28,44,0.06)',
        card: '0 1px 2px rgba(20,28,44,0.05), 0 4px 12px rgba(20,28,44,0.06)',
        pop:  '0 2px 8px rgba(20,28,44,0.08), 0 16px 34px rgba(20,28,44,0.14)',
      },
      animation: {
        'slide-up': 'slideUp 0.26s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fadeIn 0.26s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
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
