/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gridup: {
          bg: '#07090e',
          card: 'rgba(13, 17, 26, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          purple: '#a855f7',
          'purple-glow': 'rgba(168, 85, 247, 0.35)',
          cyan: '#00cfff',
          'cyan-glow': 'rgba(0, 207, 255, 0.3)',
          green: '#00ff88',
          'green-glow': 'rgba(0, 255, 136, 0.35)',
          amber: '#f59e0b',
          red: '#ef4444'
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace', 'Courier New']
      }
    },
  },
  plugins: [],
}
