/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Consolas', 'monospace'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        chat: ['Atkinson Hyperlegible Next', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulso-suave': 'pulsoSuave 2.5s ease-in-out infinite',
        'pulso-alerta': 'pulsoAlerta 1.2s ease-in-out infinite',
        flotar: 'flotar 6s ease-in-out infinite',
      },
      keyframes: {
        pulsoSuave: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        pulsoAlerta: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        flotar: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
