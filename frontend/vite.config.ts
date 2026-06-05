import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { execSync } from 'child_process';

const version = fs.readFileSync('../VERSION', 'utf-8').trim() || '0.0.0';
let commit = 'unknown';
let date = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
  date = execSync('git log -1 --format=%ai').toString().trim();
} catch {}

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_DATE__: JSON.stringify(date),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
