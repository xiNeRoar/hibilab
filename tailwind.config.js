/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './*.js',
    './**/*.php',
  ],
  // HIBI LAB shares a WordPress install with Scent.M. Scope generated utilities
  // to HIBI LAB templates and omit Tailwind's global reset so this bundle cannot
  // restyle the parent theme, wp-admin, or third-party WooCommerce components.
  important: 'body.hibilab-surface',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          beige: '#F3EAE1',
          terracotta: '#A64B2A',
          brown: '#3B261D',
          moss: '#3B4A3D',
          light: '#FDFBF9',
        },
      },
      fontFamily: {
        serif: ['Baskervville', 'Cactus Classical Serif', 'serif'],
        sans: ['Montserrat', 'Noto Sans TC', 'sans-serif'],
        script: ['Mea Culpa', 'cursive'],
      },
    },
  },
};
