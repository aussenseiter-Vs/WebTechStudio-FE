import { reactive } from 'vue'

const storedUser = localStorage.getItem('user')
const storedToken = localStorage.getItem('token')

export const auth = reactive({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
})

export function setAuth(user, token) {
  auth.user = user
  auth.token = token
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', token)
}

export function clearAuth() {
  auth.user = null
  auth.token = null
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}
