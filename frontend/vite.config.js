import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true, // Listen on all IPs
      port: 5173,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/socket.io': {
          target: apiUrl,
          ws: true,
        },
      },
    },
  };
})
