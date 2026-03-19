/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        'war-bg': '#0a0e1a',
        'war-panel': '#0f1629',
        'war-border': '#1e2d4a',
        'war-gold': '#f1c40f',
        estrategista: '#c0392b',
        pesquisador: '#f39c12',
        criativo: '#3498db',
        critico: '#9b59b6',
        editor: '#27ae60',
        analista: '#2c3e50',
      },
    },
  },
  plugins: [],
}
