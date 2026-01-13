/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hell: {
          dark: '#001800',
          darker: '#000800',
          green: '#002200',
          accent: '#002800',
        },
      },
    },
  },
  plugins: [],
};
