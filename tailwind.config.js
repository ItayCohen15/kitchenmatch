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
          50:  '#eeeefc',
          100: '#dcdcf9',
          200: '#bcbcf2',
          300: '#9899ea',
          400: '#7576e0',
          500: '#5354d3',
          600: '#4244b8',
          700: '#363793',
          800: '#2c2d73',
          900: '#22235a',
        },
        km: {
          dark:  '#131626',
          navy:  '#1b1e38',
          gold:  '#5354d3',
          'gold-light': '#7b7cee',
          violet: '#8d3cb6',
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
