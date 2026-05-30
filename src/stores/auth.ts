import { computed, shallowRef } from "vue"
import { defineStore } from "pinia"
import { login, type LoginUser } from "@/api/litewaf"
import { setUnauthorizedHandler, setAuthTokenGetter } from "@/api/client"

const STORAGE_KEY = "litewaf-auth"

interface AuthState {
  token: string
  expiresAt: string
  user: LoginUser | null
}

function loadState(): AuthState {
  const fallback: AuthState = { token: "", expiresAt: "", user: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export const useAuthStore = defineStore("auth", () => {
  const initial = loadState()
  const token = shallowRef(initial.token)
  const expiresAt = shallowRef(initial.expiresAt)
  const user = shallowRef<LoginUser | null>(initial.user)

  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value || !user.value) {
      return false
    }
    return new Date(expiresAt.value).getTime() > Date.now()
  })
  const role = computed(() => user.value?.role ?? "")
  const canWrite = computed(() => role.value === "admin")
  const canAudit = computed(() => role.value === "admin" || role.value === "auditor")

  function persist() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: token.value, expiresAt: expiresAt.value, user: user.value })
    )
  }

  async function signIn(username: string, password: string) {
    const response = await login({ username, password })
    token.value = response.access_token
    expiresAt.value = response.expires_at
    user.value = response.user
    persist()
  }

  function signOut() {
    token.value = ""
    expiresAt.value = ""
    user.value = null
    window.localStorage.removeItem(STORAGE_KEY)
  }

  setAuthTokenGetter(() => token.value)
  setUnauthorizedHandler(signOut)

  return {
    token,
    expiresAt,
    user,
    role,
    isAuthenticated,
    canWrite,
    canAudit,
    signIn,
    signOut
  }
})
