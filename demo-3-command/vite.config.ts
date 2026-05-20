import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Assets live in ./public so the project is self-contained for Vercel deploy.
// (Demo 1 references ../assets via a repo-root vercel.json; Demo 3 ships its
// own bundle so it can be deployed standalone.)
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5174,
    strictPort: false,
  },
});
