/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Токены темы через CSS-переменные → переключаются light/dark (см. index.css).
        ink: 'rgb(var(--ink) / <alpha-value>)', // основной текст
        muted: 'rgb(var(--muted) / <alpha-value>)', // вторичный текст
        surface: 'rgb(var(--surface) / <alpha-value>)', // чипы / инпуты / secondary
        night: 'rgb(var(--night) / <alpha-value>)', // панель / карточка
        base: 'rgb(var(--base) / <alpha-value>)', // главный фон
        card: 'rgb(var(--card) / <alpha-value>)', // карточка-остров
        line: 'var(--line)', // граница
        // Акцент — одинаков в обеих темах.
        magenta: '#FF2D7A',
        electric: '#D91D62',
        violet: '#FF5C8A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        13: '3.25rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        glow: '0 12px 32px -10px rgba(255,45,122,0.4)',
        soft: '0 12px 36px -16px rgba(0,0,0,0.7)',
        island: '0 8px 28px -14px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grad-accent': 'linear-gradient(135deg,#FF2D7A 0%,#D91D62 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out both',
      },
    },
  },
  plugins: [],
}
