import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  // base must be at the top level for correct asset paths in production
  base: './',
  plugins: [react()],
  build: {
    outDir: './backend/public/app',
    sourcemap: true, // makes prod errors debuggable
  },
});
