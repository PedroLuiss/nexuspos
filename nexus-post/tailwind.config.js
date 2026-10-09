/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        winblue: {
          DEFAULT: '#0067C0',
          hover: '#0078D4',
          active: '#005A9E',
          light: '#EFF6FC'
        },
        checkout: {
          DEFAULT: '#107C41',
          hover: '#0F7B0F',
          active: '#005228',
          light: '#E8F5E9'
        },
        crimson: {
          DEFAULT: '#C42B1C',
          hover: '#A82317',
          light: '#FDE8E8'
        },
        windesktop: '#F3F3F3',
        mica: '#F3F3F3'
      },
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          'Segoe UI Variable Text',
          'Segoe UI',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      borderRadius: {
        xs: '2px',
        sm: '4px'
      }
    }
  },
  plugins: []
}

