import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Accept': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export function login(username, password) {
  return api.post('/login', { username, password })
}

export function register(full_name, username, password) {
  return api.post('/register', { full_name, username, password })
}

export function logout() {
  return api.post('/logout')
}

export function getCourses() {
  return api.get('/courses')
}

export function getCourse(slug) {
  return api.get(`/courses/${slug}`)
}

export function registerCourse(slug) {
  return api.post(`/courses/${slug}/register`)
}

export function getUserProgress() {
  return api.get('/users/progress')
}

export function checkAnswer(lessonId, contentId, optionId) {
  return api.post(`/lessons/${lessonId}/contents/${contentId}/check`, { option_id: optionId })
}

export function completeLesson(lessonId) {
  return api.put(`/lessons/${lessonId}/complete`)
}

export function createCourse(data) {
  return api.post('/courses', data)
}

export function updateCourse(slug, data) {
  return api.put(`/courses/${slug}`, data)
}

export function deleteCourse(slug) {
  return api.delete(`/courses/${slug}`)
}

export function createSet(courseSlug, data) {
  return api.post(`/courses/${courseSlug}/sets`, data)
}

export function deleteSet(courseSlug, setId, name) {
  return api.delete(`/courses/${courseSlug}/sets/${setId}`, { data: { name } })
}

export function createLesson(data) {
  return api.post('/lessons', data)
}

export function deleteLesson(lessonId) {
  return api.delete(`/lessons/${lessonId}`)
}

export default api
