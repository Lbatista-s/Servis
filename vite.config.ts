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
    // Con VITE_API_MOCK=false, `/api` se reenvía a Django (mismo origen para
    // el navegador: sin CORS y con las cookies de sesión). Con la API simulada,
    // el service worker responde antes de que la petición llegue al proxy.
    proxy: {
      '/api': {
        target: loadEnv(mode, process.cwd(), '').VITE_API_PROXY || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Bibliotecas estables en paquetes propios: cambian poco y el navegador
        // las conserva en caché entre despliegues.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](antd|@ant-design|rc-[^\\/]+|@rc-component)[\\/]/.test(id)) return 'antd';
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // En Node, `fetch` necesita una URL absoluta; la API simulada responde en cualquier origen.
    env: { VITE_API_BASE_URL: 'http://localhost/api', VITE_API_MOCK: 'true' },
  },
}));
