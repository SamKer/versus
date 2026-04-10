import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  email: string
  name: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function decodeToken (t: string): User | null {
    try {
      return JSON.parse(atob(t.split('.')[1]))
    } catch {
      return null
    }
  }

  function setToken (newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    user.value = decodeToken(newToken)
  }

  function logout () {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  // Restore from localStorage on boot
  if (token.value) {
    user.value = decodeToken(token.value)
    if (!user.value) {
      token.value = null
      localStorage.removeItem('token')
    }
  }

  return { token, user, isAuthenticated, setToken, logout }
})
