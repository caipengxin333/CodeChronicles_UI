import http from './http'

export function getProfile() {
  return http.get('/profile')
}

export function getTags() {
  return http.get('/tags')
}

export function getArticles(params = {}) {
  return http.get('/articles', { params })
}

export function getArticleDetail(id) {
  return http.get(`/articles/${id}`)
}

export function createArticle(data) {
  return http.post('/articles', data)
}

export function getQuestions() {
  return http.get('/questions')
}
