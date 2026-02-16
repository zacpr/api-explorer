import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api-proxy', (req, res, next) => {
          const target = req.headers['x-proxy-target'] as string;
          if (!target) {
            res.statusCode = 400;
            res.end('Missing X-Proxy-Target header');
            return;
          }
          
          const proxy = createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: { '^/api-proxy': '' },
            onError: (err) => {
              console.error('Proxy error:', err);
            },
          });
          
          proxy(req, res, next);
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    watch: false,
    pool: 'forks',
    teardownTimeout: 5000,
  },
});
