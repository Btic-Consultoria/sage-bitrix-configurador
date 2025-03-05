/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-white': '#fefefe',
        'brand-black': '#000000',
        'brand-onyx': '#424242',
        // Creating a shade range for onyx
        'onyx': {
          DEFAULT: '#424242',
          '100': '#0d0d0d',
          '200': '#1b1b1b',
          '300': '#282828',
          '400': '#353535',
          '500': '#424242',
          '600': '#686868',
          '700': '#8e8e8e',
          '800': '#b4b4b4',
          '900': '#d9d9d9'
        }
      }
    },
  },
  plugins: [],
};
