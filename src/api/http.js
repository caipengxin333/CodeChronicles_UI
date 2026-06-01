import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000
})

http.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.info(`[api] ${config.method?.toUpperCase() || 'GET'} ${config.baseURL}${config.url}`)
  }

  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data

    if (typeof body?.code === 'number' && body.code !== 200) {
      return Promise.reject({
        code: body.code,
        message: body.message || '接口请求失败',
        response
      })
    }

    return body?.data ?? body
  },
  (error) => {
    const message =
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

export default http
