import axios from "axios"

let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  try {
    if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
      const urlObj = new URL(API_URL)
      // Only override if we are accessing via local network IP to test on mobile
      if (window.location.hostname !== 'localhost') {
        urlObj.hostname = window.location.hostname
        API_URL = urlObj.toString()
      }
    }
  } catch (e) {
    console.error("Failed to parse API_URL dynamically:", e)
  }
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
