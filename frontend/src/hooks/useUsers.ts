import { useQuery } from "@tanstack/react-query"
import { api } from "@/helpers/api"
import { useAuthStore } from "@/store/authStore"

export interface UserItem {
  _id: string
  email?: string
  phone?: string
  fullName: string
  role: string
  plan: string
  createdAt: string
}

interface FetchUsersResponse {
  data: UserItem[]
  total: number
  page: number
  limit: number
}

export const useUsers = () => {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "admin"

  // Fetch users (Admin only)
  const useFetchUsers = (params?: { page?: number; limit?: number }) =>
    useQuery({
      queryKey: ["admin-users", params],
      queryFn: async () => {
        const response = await api.get<FetchUsersResponse>("/admin/users", { params })
        return response.data
      },
      enabled: !!token && isAdmin,
    })

  // Get user details (Admin only)
  const useFetchUserDetail = (id: string) =>
    useQuery({
      queryKey: ["admin-user-detail", id],
      queryFn: async () => {
        const response = await api.get<UserItem>(`/admin/users/${id}`)
        return response.data
      },
      enabled: !!token && isAdmin && !!id,
    })

  return {
    useFetchUsers,
    useFetchUserDetail,
  }
}
