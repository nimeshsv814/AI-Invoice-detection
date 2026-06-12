import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api/auth':      { target: 'http://localhost:3001', changeOrigin: true },
      '/api/invoices':  { target: 'http://localhost:3002', changeOrigin: true },
      '/api/ocr':       { target: 'http://localhost:3003', changeOrigin: true },
      '/api/duplicate': { target: 'http://localhost:3004', changeOrigin: true },
      '/api/fraud':     { target: 'http://localhost:3005', changeOrigin: true },
      '/api/approval':  { target: 'http://localhost:3006', changeOrigin: true },
      '/api/vendors':   { target: 'http://localhost:3007', changeOrigin: true },
      '/api/notifications': { target: 'http://localhost:3008', changeOrigin: true },
      '/api/analytics': { target: 'http://localhost:3009', changeOrigin: true },
      '/api/users':     { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
