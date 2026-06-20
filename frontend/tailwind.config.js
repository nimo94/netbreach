/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nb-green': '#4ade80',
        'nb-amber': '#f59e0b',
        'nb-red': '#ef4444',
        'nb-purple': '#a78bfa',
        'nb-cyan': '#22d3ee',
        'nb-term-bg': '#0a0c10',
        'nb-app-bg': '#0d0f14',
        'nb-panel-bg': '#111318',
        'nb-hover-bg': '#1a1d26',
        'nb-border': '#1e2028',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        'xxs': '10px',
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
      },
      keyframes: {
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'progress': 'progress 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
