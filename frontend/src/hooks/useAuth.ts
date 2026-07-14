import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore, User } from "@/store/authStore"
import { authApi } from "@/api/auth"

export const useAuth = () => {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const token = useAuthStore((state) => state.token)

  // Query to fetch the user profile
  const useProfile = () =>
    useQuery({
      queryKey: ["profile"],
      queryFn: authApi.getProfile,
      enabled: !!token,
      staleTime: 1000 * 60 * 5, // 5 minutes
    })

  // Mutation to register a new user (Email/Password)
  const useRegisterMutation = () =>
    useMutation({
      mutationFn: authApi.register,
      onSuccess: (data) => {
        // Automatically login the user after registration if token returned
        if (data.accessToken && data.user) {
          setAuth(data.user, data.accessToken)
        }
      },
    })

  // Mutation to login (Email or Phone + Password)
  const useLoginMutation = () =>
    useMutation({
      mutationFn: authApi.login,
      onSuccess: (data) => {
        if (data.token.accessToken && data.user) {
          setAuth(data.user, data.token.accessToken)
          queryClient.invalidateQueries({ queryKey: ["profile"] })
        }
      },
    })

  // Mutation for Firebase Phone Verification
  const useFirebasePhoneMutation = () =>
    useMutation({
      mutationFn: authApi.verifyFirebasePhone,
      onSuccess: (data) => {
        if (data.accessToken && data.user) {
          setAuth(data.user, data.accessToken)
          queryClient.invalidateQueries({ queryKey: ["profile"] })
        }
      },
    })

  const useUpdateProfileMutation = () =>
    useMutation({
      mutationFn: authApi.updateProfile,
      onSuccess: (updatedUser) => {
        // Update user state in store
        if (token) {
          setAuth(updatedUser, token)
        }
        queryClient.invalidateQueries({ queryKey: ["profile"] })
      },
    })

  // Logout handler
  const logout = () => {
    clearAuth()
    queryClient.clear()
  }

  return {
    useProfile,
    useRegisterMutation,
    useLoginMutation,
    useFirebasePhoneMutation,
    useUpdateProfileMutation,
    logout,
  }
}
