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

export function getMyArticles(params = {}) {
  return http.get('/my/articles', { params })
}

export function getAdminArticles(params = {}) {
  return http.get('/admin/articles', { params })
}

export function getArticleDetail(id) {
  return http.get(`/articles/${id}`)
}

export function createArticle(data) {
  return http.post('/articles', data)
}

export function saveArticleDraft(data) {
  return http.post('/articles/drafts', data)
}

export function updateArticle(id, data) {
  return http.put(`/articles/${id}`, data)
}

export function deleteArticle(id) {
  return http.delete(`/articles/${id}`)
}

export function submitArticleReview(id) {
  return http.post(`/articles/${id}/submit`)
}

export function reviewArticle(id, data) {
  return http.post(`/admin/articles/${id}/review`, data)
}

export function getQuestions() {
  return http.get('/questions')
}
