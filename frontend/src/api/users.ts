import { api } from "@/helpers/api"

export interface UserItem {
  _id: string
  email?: string
  phone?: string
  fullName: string
  role: string
  plan: string
  createdAt: string
}

export interface FetchUsersResponse {
  data: UserItem[]
  total: number
  page: number
  limit: number
}

export const usersApi = {
  fetchUsers: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get<FetchUsersResponse>("/admin/users", { params })
    return response.data
  },
  fetchUserDetail: async (id: string) => {
    const response = await api.get<UserItem>(`/admin/users/${id}`)
    return response.data
  },
  updateUser: async (id: string, data: Partial<UserItem>) => {
    const response = await api.put(`/admin/users/${id}`, data)
    return response.data
  },
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },
}
