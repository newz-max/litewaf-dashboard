import axios from "axios"

let authTokenGetter: (() => string) | undefined
let unauthorizedHandler: (() => void) | undefined

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
})

export function setAuthTokenGetter(getter: () => string) {
  authTokenGetter = getter
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

apiClient.interceptors.request.use((config) => {
  const token = authTokenGetter?.()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  }
)
