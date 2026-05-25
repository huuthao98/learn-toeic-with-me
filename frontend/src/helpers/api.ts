import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

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
        localStorage.removeItem("learntoeic-auth")
        window.location.href = "/auth/login"
      }
    }
    return Promise.reject(error)
  }
)
