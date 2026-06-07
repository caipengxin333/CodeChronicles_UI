import http, { API_BASE_URL, handleAuthExpired } from './http'

export function getChatHistory() {
  return http.get('/chat/history')
}

export async function streamChatMessage(message, onChunk, signal) {
  const token = localStorage.getItem('codechronicles_token')
  const apiBaseUrl = new URL(API_BASE_URL, window.location.origin)
  const url = new URL(`${apiBaseUrl.href.replace(/\/$/, '')}/chat/`)
  url.searchParams.set('message', message)

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal
  })

  if (response.status === 401) {
    handleAuthExpired()
    const error = new Error('登录已过期，请重新登录')
    error.code = 401
    throw error
  }

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody?.msg || errorBody?.message || `AI 请求失败（${response.status}）`)
  }

  if (!response.body) {
    onChunk(await response.text())
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value, { stream: true })
    if (text) onChunk(text)
  }

  const remainingText = decoder.decode()
  if (remainingText) onChunk(remainingText)
}

async function readErrorBody(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}
