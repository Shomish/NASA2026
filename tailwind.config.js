/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fondo: 'rgb(var(--fondo) / <alpha-value>)',
        superficie: 'rgb(var(--superficie) / <alpha-value>)',
        'superficie-elevada': 'rgb(var(--superficie-elevada) / <alpha-value>)',
        'superficie-alta': 'rgb(var(--superficie-alta) / <alpha-value>)',
        borde: 'rgb(var(--borde) / <alpha-value>)',
        'borde-fuerte': 'rgb(var(--borde-fuerte) / <alpha-value>)',
        tinta: 'rgb(var(--tinta) / <alpha-value>)',
        'tinta-suave': 'rgb(var(--tinta-suave) / <alpha-value>)',
        primario: 'rgb(var(--primario) / <alpha-value>)',
        'primario-fuerte': 'rgb(var(--primario-fuerte) / <alpha-value>)',
        secundario: 'rgb(var(--secundario) / <alpha-value>)',
        'secundario-fuerte': 'rgb(var(--secundario-fuerte) / <alpha-value>)',
        exito: 'rgb(var(--exito) / <alpha-value>)',
        advertencia: 'rgb(var(--advertencia) / <alpha-value>)',
        'advertencia-fuerte': 'rgb(var(--advertencia-fuerte) / <alpha-value>)',
        critico: 'rgb(var(--critico) / <alpha-value>)',
        'andino-dorado': 'rgb(var(--andino-dorado) / <alpha-value>)',
        'andino-terracota': 'rgb(var(--andino-terracota) / <alpha-value>)',
      },
      borderRadius: {
        tarjeta: 'var(--radio-tarjeta)',
        boton: 'var(--radio-boton)',
        insignia: 'var(--radio-insignia)',
      },
      boxShadow: {
        consola: 'var(--sombra-consola)',
        glow: 'var(--sombra-glow)',
      },
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
