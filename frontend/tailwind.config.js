/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'patek': {
          'dark': '#0a0a0f',
          'darker': '#050508',
          'card': '#12121a',
          'border': '#1e1e2a',
          'accent': '#c9a227',
          'accent-light': '#e6c64a',
          'text': '#e8e8e8',
          'muted': '#6b6b7a'
        }
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
