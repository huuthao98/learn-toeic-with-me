import { api } from "@/helpers/api"

export interface FirebasePhoneData {
  token: string
  fullName?: string
}

export const authApi = {
  register: async (data: any) => {
    const response = await api.post("/auth/register", data)
    return response.data
  },
  login: async (data: any) => {
    const response = await api.post("/auth/login", data)
    return response.data
  },
  verifyFirebasePhone: async (data: FirebasePhoneData) => {
    const response = await api.post("/auth/firebase-phone", data)
    return response.data
  },
  getProfile: async () => {
    const response = await api.get("/auth/profile")
    return response.data
  },
}
