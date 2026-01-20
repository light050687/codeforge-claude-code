import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/client'
import type { TopUsersResponse, UserResponse } from '../types/api'

export function useTopUsers(limit: number = 10) {
  return useQuery<TopUsersResponse>({
    queryKey: ['users', 'top', limit],
    queryFn: async () => {
      const response = await usersApi.topUsers(limit)
      return response.data
    },
  })
}

interface UserFilters {
  page?: number
  size?: number
  sort_by?: 'score' | 'solutions' | 'recent'
}

export function useUsers(filters: UserFilters = {}) {
  return useQuery<UserResponse[]>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await usersApi.list(filters)
      return response.data
    },
  })
}

export function useUser(id: string | null) {
  return useQuery<UserResponse>({
    queryKey: ['user', id],
    queryFn: async () => {
      const response = await usersApi.get(id!)
      return response.data
    },
    enabled: id !== null,
  })
}

export function useUserByUsername(username: string | null) {
  return useQuery<UserResponse>({
    queryKey: ['user', 'username', username],
    queryFn: async () => {
      const response = await usersApi.getByUsername(username!)
      return response.data
    },
    enabled: username !== null,
  })
}
