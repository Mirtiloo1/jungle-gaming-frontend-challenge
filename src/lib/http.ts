import axios from 'axios'
import { readGuestId, readSessionToken } from './session-token'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const token = readSessionToken()
  config.headers['X-Guest-Id'] = readGuestId()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      error.config?.headers?.Authorization === `Bearer ${readSessionToken()}`
    ) {
      window.dispatchEvent(new Event('kurio:session-expired'))
    }
    return Promise.reject(error)
  },
)
