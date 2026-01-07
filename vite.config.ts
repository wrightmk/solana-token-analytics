import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_KEY = env.VITE_API_KEY
  const API_TARGET = env.VITE_API_TARGET
  const WS_TARGET = env.VITE_WS_TARGET

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: ['.ngrok-free.app', '.ngrok.io'],
      proxy: {
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/v1'),
          headers: {
            'x-api-key': API_KEY,
          },
        },
        '/ws': {
          target: WS_TARGET,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/ws/, ''),
          headers: {
            'x-api-key': API_KEY,
          },
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('WebSocket proxy error:', err)
            })
            proxy.on('proxyReqWs', (proxyReq) => {
              proxyReq.setHeader('x-api-key', API_KEY)
            })
          },
        },
      },
    },
  }
})
