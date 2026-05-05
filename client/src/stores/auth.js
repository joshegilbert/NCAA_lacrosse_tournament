import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api, setToken } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchMe() {
    const t = localStorage.getItem('token')
    if (!t) {
      user.value = null
      return
    }
    loading.value = true
    try {
      const data = await api('/auth/me')
      user.value = data.user
    } catch {
      user.value = null
      setToken(null)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  async function login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    user.value = data.user
    return data
  }

  async function register(name, email, password) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setToken(data.token)
    user.value = data.user
    return data
  }

  return { user, loading, isAuthenticated, fetchMe, logout, login, register }
})
