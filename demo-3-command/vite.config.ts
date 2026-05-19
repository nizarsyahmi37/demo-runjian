import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve ../assets as /assets so we can reference shared assets via absolute URL.
export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, '../assets'),
  server: {
    port: 5173,
    strictPort: false,
  },
});
