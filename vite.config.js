import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Custom Vite plugin to proxy /ollama/* requests to Ollama Cloud.
 * Uses native fetch instead of http-proxy to properly handle HTTPS/HTTP2 targets.
 */
function ollamaProxyPlugin(ollamaBaseUrl, apiKey) {
  return {
    name: 'ollama-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/ollama/')) return next()

        const targetPath = req.url.replace(/^\/ollama/, '')
        const targetUrl = `${ollamaBaseUrl}${targetPath}`

        // Read request body for POST
        let body = ''
        if (req.method === 'POST') {
          body = await new Promise((resolve) => {
            const chunks = []
            req.on('data', (chunk) => chunks.push(chunk))
            req.on('end', () => resolve(Buffer.concat(chunks).toString()))
          })
        }

        try {
          const headers = { 'Content-Type': 'application/json' }
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

          const fetchOpts = { method: req.method, headers }
          if (req.method === 'POST' && body) fetchOpts.body = body

          console.log(`🔄 Proxy: ${req.method} ${req.url} → ${targetUrl}`)
          const response = await fetch(targetUrl, fetchOpts)

          res.writeHead(response.status, {
            'Content-Type': response.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          const data = await response.text()
          res.end(data)
        } catch (err) {
          console.error('❌ Proxy error:', err.message)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Proxy failed', details: err.message }))
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ollamaBaseUrl = env.VITE_OLLAMA_BASE_URL || 'https://ollama.com'
  const ollamaApiKey = env.VITE_OLLAMA_API_KEY || ''

  return {
    plugins: [
      react(),
      ollamaProxyPlugin(ollamaBaseUrl, ollamaApiKey)
    ],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    server: {
      port: 3000
    }
  }
})
