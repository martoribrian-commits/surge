/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        surge: {
          black: '#0A0A0A',
          bone: '#F4F0EB',
          clay: '#B6502E',
          pulse: '#C45A32',
          static: '#6B6B6B',
        },
      },
    },
  },
  plugins: [],
};
