import http from './http'

export const VISITOR_ACCOUNT = Object.freeze({
  phone: '19900000000',
  password: 'Visitor2026'
})

export function getCaptcha() {
  return http.get('/captcha')
}

export function login(data) {
  return http.post('/login', data)
}

export function loginAsVisitor() {
  return login(VISITOR_ACCOUNT)
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
