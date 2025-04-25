/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#98f5e1',    // Mint Green
        accent: '#a0d2eb',     // Soft Blue
        accent2: '#dcd6f7',    // Light Lavender
        background: '#f9f9f9', // Light Gray
        text: '#333333',       // Charcoal
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
