/**
 * Vercel Serverless Proxy for Ollama Cloud API
 * 
 * All /ollama/api/chat requests are rewritten to this function.
 * Proxies to https://ollama.com/api/chat with server-side API key injection.
 * 
 * Environment variable required in Vercel dashboard:
 *   OLLAMA_API_KEY - Your Ollama Cloud API key
 *   OLLAMA_MODEL   - (optional) defaults to gemini-3-flash-preview:cloud
 */

export default async function handler(req, res) {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const apiKey = process.env.OLLAMA_API_KEY
  if (!apiKey) {
    console.error('❌ OLLAMA_API_KEY environment variable is not set')
    return res.status(500).json({ error: 'Server configuration error: missing API key' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    console.log(`🔄 Proxying chat request → https://ollama.com/api/chat (model: ${body?.model || 'unknown'})`)

    const response = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.text()

    res.status(response.status)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    return res.send(data)
  } catch (error) {
    console.error('❌ Ollama proxy error:', error.message)
    return res.status(502).json({ error: 'Failed to connect to Ollama Cloud', details: error.message })
  }
}
