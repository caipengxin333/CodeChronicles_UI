import http from './http'

export function getCaptcha() {
  return http.get('/captcha')
}

export function login(data) {
  return http.post('/login', data)
}

export function register(data) {
  return http.post('/register', data)
}

export function getCurrentUser() {
  return http.get('/me')
}

export function logout() {
  return http.post('/logout')
}
