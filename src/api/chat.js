import http, { API_BASE_URL, handleAuthExpired, handleForbidden } from './http'
import { getAuthToken } from '../auth/session'

export function getChatHistory() {
  return http.get('/chat/history')
}

export async function streamChatMessage(message, onChunk, signal) {
  const token = getAuthToken()
  const apiBaseUrl = new URL(API_BASE_URL, window.location.origin)
  const url = new URL(`${apiBaseUrl.href.replace(/\/$/, '')}/chat/stream`)

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message }),
    signal
  })

  if (response.status === 401) {
    handleAuthExpired()
    const error = new Error('登录已过期，请重新登录')
    error.code = 401
    throw error
  }

  if (response.status === 403) {
    const errorBody = await readErrorBody(response)
    const message = errorBody?.msg || errorBody?.message || '游客账号仅支持文章浏览和 AI 对话'
    handleForbidden(message)
    const error = new Error(message)
    error.code = 403
    error.notified = true
    throw error
  }

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody?.msg || errorBody?.message || `AI 请求失败（${response.status}）`)
  }

  if (!response.body) {
    throw new Error('当前浏览器不支持流式读取 AI 回复')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let completed = false

  try {
    while (!completed) {
      const { done, value } = await reader.read()

      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      const parsed = consumeSseEvents(buffer, onChunk, done)
      buffer = parsed.remaining
      completed = parsed.completed

      if (done) break
    }

    if (completed) await reader.cancel()
  } finally {
    reader.releaseLock()
  }
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

function consumeSseEvents(source, onChunk, flush = false) {
  let remaining = source
  let completed = false
  let boundary = findEventBoundary(remaining)

  while (boundary) {
    const eventBlock = remaining.slice(0, boundary.index)
    remaining = remaining.slice(boundary.index + boundary.length)
    completed = dispatchSseEvent(eventBlock, onChunk) || completed

    if (completed) return { remaining: '', completed: true }
    boundary = findEventBoundary(remaining)
  }

  if (flush && remaining.trim()) {
    completed = dispatchSseEvent(remaining, onChunk)
    remaining = ''
  }

  return { remaining, completed }
}

function findEventBoundary(source) {
  const match = source.match(/(?:\r\n|\n|\r)(?:\r\n|\n|\r)/)
  return match ? { index: match.index, length: match[0].length } : null
}

function dispatchSseEvent(eventBlock, onChunk) {
  let eventType = 'message'
  const dataLines = []

  eventBlock.split(/\r\n|\n|\r/).forEach((line) => {
    if (!line || line.startsWith(':')) return

    const separatorIndex = line.indexOf(':')
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex)
    let value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') eventType = value
    if (field === 'data') dataLines.push(value)
  })

  const data = dataLines.join('\n')

  if (eventType === 'done') return true
  if (eventType === 'error') throw new Error(data || 'AI 调用失败，请稍后重试')
  if (eventType === 'message' && data) onChunk(data)

  return false
}
