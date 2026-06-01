/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          pale: '#D8F3DC',
        },
        gold: {
          DEFAULT: '#B8860B',
          light: '#FFD700',
        },
      },
      fontFamily: {
        arabic: ['"Noto Sans Arabic"', 'sans-serif'],
        display: ['Cairo', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};
