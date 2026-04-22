/**
 * GreenCoin Corporate API Client
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('gc_corp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gc_corp_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export interface CreditBundle {
  id: string
  name: string
  description: string | null
  total_credits: number
  total_tonnes: number
  total_users: number
  action_types: Array<{ type: string; credits: number; pct: number }>
  region: string | null
  quality_score: number
  price_per_tonne: number
  total_price: number
  status: string
  created_at: string
}

export const authApi = {
  login: (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password })
    return api.post('/auth/login', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/auth/me'),
}

export const marketApi = {
  getBundles: (params?: { region?: string; min_quality?: number; max_price?: number }) =>
    api.get<CreditBundle[]>('/marketplace/bundles', { params }),
  purchase: (bundleId: string, creditsToBy?: number) =>
    api.post(`/marketplace/purchase?bundle_id=${bundleId}${creditsToBy ? `&credits_to_buy=${creditsToBy}` : ''}`),
  getCertificate: (certId: string) =>
    api.get(`/marketplace/certificate/${certId}`),
}

export const demoApi = {
  run: () => api.post('/demo/run'),
}
