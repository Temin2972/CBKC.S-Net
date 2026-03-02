import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ollamaBaseUrl = env.VITE_OLLAMA_BASE_URL || 'https://ollama.com'

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000,
      proxy: {
        // Proxy /ollama requests to Ollama Cloud to avoid CORS issues
        '/ollama': {
          target: ollamaBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ollama/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('Proxy error:', err.message)
            })
          }
        }
      }
    }
  }
})
