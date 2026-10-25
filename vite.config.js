import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // React et le routeur changent rarement : fichier séparé, gardé en cache par le navigateur entre deux mises à jour du site
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
