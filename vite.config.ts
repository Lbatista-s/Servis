/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
    // Con VITE_DATA_SOURCE=http, `/api` se reenvía a Django (mismo origen para
    // el navegador: sin CORS y con las cookies de sesión).
    proxy: {
      '/api': {
        target: loadEnv(mode, process.cwd(), '').VITE_API_PROXY || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}));
