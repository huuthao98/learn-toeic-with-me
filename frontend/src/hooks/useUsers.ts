import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { usersApi } from "@/api/users"

export type { UserItem } from "@/api/users"

export const useUsers = () => {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "admin"

  // Fetch users (Admin only)
  const useFetchUsers = (params?: { page?: number; limit?: number }) =>
    useQuery({
      queryKey: ["admin-users", params],
      queryFn: () => usersApi.fetchUsers(params),
      enabled: !!token && isAdmin,
    })

  // Get user details (Admin only)
  const useFetchUserDetail = (id: string) =>
    useQuery({
      queryKey: ["admin-user-detail", id],
      queryFn: () => usersApi.fetchUserDetail(id),
      enabled: !!token && isAdmin && !!id,
    })

  return {
    useFetchUsers,
    useFetchUserDetail,
  }
}
