import axios, { type AxiosError } from 'axios'
import type { ApiEnvelope, Paginated } from '@/types/api'
import { useAuthStore } from '@/store/auth'

/**
 * Central axios instance. In dev, VITE_API_URL is '/api/v1' and Vite proxies
 * it to the Laravel backend (no CORS). In prod, set VITE_API_URL to the full
 * API origin, e.g. https://api.example.com/api/v1.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

// ===== Envelope-unwrapping helpers — return `.data.data` directly =====

export async function apiGet<T>(url: string, params?: object): Promise<T> {
  const { data } = await api.get<ApiEnvelope<T>>(url, { params })
  return data.data
}

export async function apiPost<T>(url: string, body?: object): Promise<T> {
  const { data } = await api.post<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiPatch<T>(url: string, body?: object): Promise<T> {
  const { data } = await api.patch<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiPut<T>(url: string, body?: object): Promise<T> {
  const { data } = await api.put<ApiEnvelope<T>>(url, body)
  return data.data
}

export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiEnvelope<T>>(url)
  return data.data
}

export async function apiGetPaginated<T>(url: string, params?: object): Promise<Paginated<T>> {
  const { data } = await api.get<ApiEnvelope<T[]>>(url, { params })
  return {
    items: data.data,
    meta: data.meta ?? {
      current_page: 1,
      per_page: data.data.length,
      total: data.data.length,
      last_page: 1,
    },
  }
}

/** Extract a human-readable message from an API error (envelope-aware). */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const env = error.response?.data as ApiEnvelope<unknown> | undefined
    if (env?.message) return env.message
    if (env?.errors) {
      const first = Object.values(env.errors)[0]
      if (Array.isArray(first) && first[0]) return first[0]
    }
  }
  return fallback
}
