import { ref, readonly } from 'vue'

export interface AuthUser {
  id: string
  displayName: string
  avatar: string
  email: string
}

const user = ref<AuthUser | null>(null)
const isLoading = ref(false)

const API_BASE = 'http://localhost:3001'

export function useAuth() {
  async function fetchUser() {
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      const data = await res.json()
      user.value = data.user || null
    } catch {
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  function loginWithGoogle() {
    window.location.href = `${API_BASE}/auth/google`
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {
      // ignore
    }
    user.value = null
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    isAuthenticated: readonly(ref(false)), // computed would be better but keeping simple
    fetchUser,
    loginWithGoogle,
    logout,
  }
}
