import axios from "axios"

let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Tự động lấy IP mạng hiện tại (dù ở nhà hay công ty) - Chỉ dùng cho môi trường dev
  API_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`
}


export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Inject authorization token into all outgoing requests
api.interceptors.request.use(
  (config) => {
    let token = null
    if (typeof window !== "undefined") {
      try {
        const authData = localStorage.getItem("learntoeic-auth")
        if (authData) {
          const parsed = JSON.parse(authData)
          token = parsed?.state?.token
        }
      } catch (e) {
        console.error("Failed to parse auth token from localStorage", e)
      }
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercept responses to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const isAuthUrl = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
        if (!isAuthUrl) {
          localStorage.removeItem("learntoeic-auth")
          window.location.href = "/auth/login"
        }
      }
    }
    return Promise.reject(error)
  }
)
