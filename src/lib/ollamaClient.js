/**
 * Ollama Cloud API Client (official ollama-js library)
 * 
 * Uses the official Ollama JavaScript library (ollama/browser) for browser-compatible
 * API calls, routed through a proxy:
 * 
 * - Dev: Vite custom proxy plugin forwards /ollama/* → https://ollama.com/*
 * - Production (Vercel): Serverless function at /api/ollama-chat handles the proxy
 * 
 * A custom fetch rewrites library URLs to /ollama/* so the same proxy path
 * works in both environments.
 */

import { Ollama } from 'ollama/browser'

const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY || ''
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'gpt-oss:20b-cloud'
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://ollama.com'

const isDev = import.meta.env.DEV

console.log(`🤖 Ollama Client: mode=${isDev ? 'dev' : 'production'}, model=${OLLAMA_MODEL}, key=${OLLAMA_API_KEY ? 'configured' : 'server-side'}`)

/**
 * Ollama client instance configured for proxy routing.
 * 
 * The custom fetch intercepts all requests and rewrites URLs from
 * https://ollama.com:443/api/* → /ollama/api/* so they go through
 * our dev proxy (Vite plugin) or production proxy (Vercel serverless fn).
 */
const ollama = new Ollama({
  host: OLLAMA_BASE_URL,
  // In dev, include Bearer token client-side. In prod, the serverless fn injects it.
  headers: OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {},
  // Rewrite all URLs to our proxy path
  fetch: (url, options) => {
    const parsed = new URL(url)
    const proxyUrl = '/ollama' + parsed.pathname + parsed.search
    return globalThis.fetch(proxyUrl, options)
  }
})

/**
 * Send a chat completion request to Ollama Cloud
 * @param {Object} options
 * @param {Array<{role: string, content: string}>} options.messages - Chat messages
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @param {number} [options.maxTokens=1020] - Max tokens (num_predict)
 * @param {string} [options.model] - Model override
 * @param {Object} [options.format] - Structured output format (JSON schema)
 * @param {boolean|string} [options.think='low'] - Thinking mode level
 * @returns {Promise<string>} The assistant's response text
 */
export async function ollamaChat({ messages, temperature = 0.7, maxTokens = 1020, model = null, format = null, think = 'low' }) {
  const request = {
    model: model || OLLAMA_MODEL,
    messages,
    stream: false,
    think,
    options: {
      temperature,
      num_predict: maxTokens
    }
  }

  if (format) {
    request.format = format
  }

  const response = await ollama.chat(request)
  let content = response.message?.content || ''

  // Strip markdown code blocks if model wraps response in ```json ... ```
  content = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  return content
}

export { OLLAMA_API_KEY, OLLAMA_MODEL, OLLAMA_BASE_URL, ollama }