/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Escala neutra usada para texto, superficies y la acción primaria
        // (botones casi negros en vez del típico botón verde/azul saturado).
        ink: {
          50: '#f7f7f8',
          100: '#eceeef',
          200: '#d7dade',
          300: '#b5bac0',
          400: '#8b929b',
          500: '#6b7280',
          600: '#535966',
          700: '#40454e',
          800: '#292c33',
          900: '#17181b',
        },
        // Acento de marca: se usa con moderación (enlaces, foco, estados activos,
        // confirmaciones, disponibilidad), no como color de fondo por defecto de
        // cada botón. Debe leerse claramente como "verde" — no tan apagado que
        // se confunda con el gris neutro de la interfaz.
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
