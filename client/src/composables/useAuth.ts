import { ref, readonly, computed } from 'vue'

export interface AuthUser {
  id: string
  displayName: string
  avatar: string
  email: string
}

const user = ref<AuthUser | null>(null)
const isLoading = ref(false)
const authError = ref<string | null>(null)

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

  async function loginWithEmail(email: string, password: string): Promise<{ success: boolean; needsVerification?: boolean }> {
    authError.value = null
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false, needsVerification: data.needsVerification }
      }
      user.value = data.user
      return { success: true }
    } catch {
      authError.value = 'Login failed'
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function signup(email: string, password: string, displayName: string): Promise<{ success: boolean }> {
    authError.value = null
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false }
      }
      return { success: true }
    } catch {
      authError.value = 'Registration failed'
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function verifyEmail(email: string, code: string): Promise<{ success: boolean }> {
    authError.value = null
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false }
      }
      user.value = data.user
      return { success: true }
    } catch {
      authError.value = 'Verification failed'
      return { success: false }
    } finally {
      isLoading.value = false
    }
  }

  async function resendVerification(email: string): Promise<{ success: boolean }> {
    authError.value = null
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false }
      }
      return { success: true }
    } catch {
      authError.value = 'Failed to resend code'
      return { success: false }
    }
  }

  async function forgotPassword(email: string): Promise<{ success: boolean }> {
    authError.value = null
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false }
      }
      return { success: true }
    } catch {
      authError.value = 'Failed to send reset code'
      return { success: false }
    }
  }

  async function resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean }> {
    authError.value = null
    isLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        authError.value = data.error
        return { success: false }
      }
      user.value = data.user
      return { success: true }
    } catch {
      authError.value = 'Failed to reset password'
      return { success: false }
    } finally {
      isLoading.value = false
    }
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
    authError: readonly(authError),
    isAuthenticated: computed(() => !!user.value),
    fetchUser,
    loginWithGoogle,
    loginWithEmail,
    signup,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
  }
}
