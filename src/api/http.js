import axios from 'axios'
import { ElMessage } from 'element-plus'
import { clearAuthSession, getAuthToken } from '../auth/session'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
})

let authExpiredHandling = false

http.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (import.meta.env.DEV) {
    console.info(`[api] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL}${config.url}`)
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data

    if (body?.code === 401) {
      handleAuthExpired()

      return Promise.reject({
        code: 401,
        message: body.msg || body.message || '登录已过期，请重新登录',
        response
      })
    }

    if (body?.code === 403) {
      const message = body.msg || body.message || '游客账号仅支持文章浏览和 AI 对话'
      handleForbidden(message)

      return Promise.reject({
        code: 403,
        message,
        response,
        notified: true
      })
    }

    if (typeof body?.code === 'number' && body.code !== 200) {
      return Promise.reject({
        code: body.code,
        message: body.msg || body.message || '接口请求失败',
        response
      })
    }

    return body?.data ?? body
  },
  (error) => {
    if (error.response?.status === 401) {
      handleAuthExpired()
    }

    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      '网络异常，请稍后重试'

    if (error.response?.status === 403) {
      handleForbidden(message)
    }

    return Promise.reject({
      ...error,
      code: error.response?.status,
      message,
      notified: error.response?.status === 403
    })
  }
)

export function handleAuthExpired() {
  clearAuthSession()

  if (authExpiredHandling) return

  authExpiredHandling = true
  ElMessage.warning('登录已过期，请重新登录')

  const currentPath = window.location.hash.slice(1) || '/'
  const redirect =
    currentPath && currentPath !== '/login' && currentPath !== '/register'
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : ''

  setTimeout(() => {
    window.location.replace(`/#/login${redirect}`)
  }, 300)
}

export function handleForbidden(message = '游客账号仅支持文章浏览和 AI 对话') {
  ElMessage({
    message,
    type: 'warning',
    grouping: true
  })
}

export default http
