module.exports = {
  plugins: {
    tailwindcss: {},
    // An explicit older target (`npm run build:tv`) also gets physical sides before logical ones (Chrome 68).
    ...(process.env.BROWSERSLIST ? { './postcss-legacy.js': {} } : {}),
    autoprefixer: {},
  },
}
