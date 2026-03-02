/**
 * Vercel Serverless Proxy for Ollama Cloud API (catch-all route)
 * 
 * Catches all requests to /api/ollama/* and proxies them to https://ollama.com/*
 * Keeps the API key server-side (never exposed to the browser)
 * 
 * Environment variable required in Vercel dashboard:
 *   OLLAMA_API_KEY - Your Ollama Cloud API key
 */

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }

  // Extract the path segments after /api/ollama/
  // req.query.path is an array like ['api', 'chat'] for /api/ollama/api/chat
  const pathSegments = req.query.path || []
  const targetPath = '/' + pathSegments.join('/')
  const targetUrl = `https://ollama.com${targetPath}`

  const apiKey = process.env.OLLAMA_API_KEY
  if (!apiKey) {
    console.error('❌ OLLAMA_API_KEY environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error: missing API key' })
  }

  // Only allow POST and GET
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }

    // Forward body for POST requests
    if (req.method === 'POST' && req.body) {
      fetchOptions.body = JSON.stringify(req.body)
    }

    console.log(`🔄 Proxying ${req.method} → ${targetUrl}`)
    const response = await fetch(targetUrl, fetchOptions)

    // Forward the status and body back to the client
    const data = await response.text()

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    res.status(response.status)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    return res.send(data)
  } catch (error) {
    console.error('❌ Ollama proxy error:', error.message)
    return res.status(502).json({ error: 'Failed to connect to Ollama Cloud', details: error.message })
  }
}
