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
          DEFAULT: '#0078D4',
          hover: '#106EBE',
          active: '#005A9E',
          light: '#EFF6FC'
        },
        windesktop: '#F3F4F6'
      },
      fontFamily: {
        sans: [
          'Segoe UI Variable Text',
          'Segoe UI',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
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
