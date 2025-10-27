module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
      },
      fontFamily: {
        heading: ['Urbanist', 'sans-serif'],
        body: ['Hauora Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
