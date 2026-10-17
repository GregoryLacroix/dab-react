// Tailwind ne sert qu'au back-office : il ne scanne que src/admin, n'applique ses classes
// qu'à l'intérieur de .admin-root et n'active pas son "preflight" (le site public reste intact).
export default {
  content: ['./src/admin/**/*.{js,jsx}'],
  important: '.admin-root',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        sand: { 50: '#faf6ef', 100: '#f2eadc', 200: '#e6d9c3', 400: '#b9a68a', 700: '#4a4034' },
        brand: { 100: '#dbe6f7', 300: '#7fa3e0', 600: '#1f4fb5', 900: '#0f2a6b' },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'Arial', 'sans-serif'],
        display: ['Roboto', 'system-ui', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
