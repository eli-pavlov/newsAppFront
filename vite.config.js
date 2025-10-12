import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // IMPORTANT: base must be top-level (not inside `build`)
  base: './',
  plugins: [react()],
  build: {
    outDir: './backend/public/app',
    sourcemap: true, // helpful for debugging production errors
  },
});
