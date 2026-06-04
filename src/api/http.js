import axios from 'axios'
import { ElMessage } from 'element-plus'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true
})

let authExpiredHandling = false

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('codechronicles_token')

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

    return Promise.reject({
      ...error,
      code: error.response?.status,
      message
    })
  }
)

function handleAuthExpired() {
  localStorage.removeItem('codechronicles_token')
  localStorage.removeItem('codechronicles_user')
  localStorage.removeItem('userInfo')

  if (authExpiredHandling) return

  authExpiredHandling = true
  ElMessage.warning('登录已过期，请重新登录')

  const currentPath = `${window.location.pathname}${window.location.search}`
  const redirect =
    currentPath && currentPath !== '/login' && currentPath !== '/register'
      ? `?redirect=${encodeURIComponent(currentPath)}`
      : ''

  setTimeout(() => {
    window.location.href = `/login${redirect}`
  }, 300)
}

export default http
