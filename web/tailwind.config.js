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
          amber: '#f5a623',
          forest: '#143328',
          ocean: '#1a3a52',
          mist: '#9eb5a8',
          void: '#070b09',
        },
      },
    },
  },
  plugins: [],
};
