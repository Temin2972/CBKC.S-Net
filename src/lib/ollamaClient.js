/**
 * Ollama Cloud API Client
 * 
 * Centralized client for calling Ollama Cloud API.
 * 
 * In development: Vite proxy forwards /ollama/* → https://ollama.com/*
 * In production (Vercel): Serverless function at /api/ollama/* handles the proxy
 * Both use the same /ollama/api/chat path from the frontend.
 * 
 * The API key is sent client-side in dev (from VITE_OLLAMA_API_KEY),
 * and injected server-side in production (from OLLAMA_API_KEY env var).
 */

const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY || ''
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'gemini-3-flash-preview:cloud'
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama.com'

// In dev mode, use the Vite proxy path. In production, also use /ollama path (Vercel rewrites it).
const isDev = import.meta.env.DEV
const API_CHAT_URL = isDev ? '/ollama/api/chat' : '/ollama/api/chat'

console.log(`🤖 Ollama Client: mode=${isDev ? 'dev' : 'production'}, model=${OLLAMA_MODEL}, key=${OLLAMA_API_KEY ? 'configured' : 'server-side'}`)

/**
 * Send a chat completion request to Ollama Cloud
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages - Chat messages
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @param {number} [options.maxTokens=500] - Max tokens (num_predict)
 * @param {string} [options.model] - Model override
 * @returns {Promise<string>} The assistant's response text
 */
export async function ollamaChat({ messages, temperature = 0.7, maxTokens = 500, model = null }) {
  const headers = { 'Content-Type': 'application/json' }
  
  // Add auth header if client-side key is available (dev mode)
  if (OLLAMA_API_KEY) {
    headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
  }

  const response = await fetch(API_CHAT_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature,
        num_predict: maxTokens
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Ollama API error:', response.status, errorText)
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}

export { OLLAMA_API_KEY, OLLAMA_MODEL, OLLAMA_BASE_URL }
