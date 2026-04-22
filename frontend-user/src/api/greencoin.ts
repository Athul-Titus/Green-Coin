/**
 * GreenCoin API Client
 * Axios-based client with JWT auth interceptors
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Auth token injection ──────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('gc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auto-logout on 401 ───────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gc_token')
      localStorage.removeItem('gc_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Typed API Methods ─────────────────────────────────────

export interface LoginResponse {
  access_token: string
  token_type: string
  user_type: string
  user_id: string
}

export interface User {
  id: string
  email: string
  full_name: string
  user_type: string
  city: string | null
  company_name: string | null
  green_score: number
  created_at: string
}

export interface ActionType {
  code: string
  display_name: string
  category: string
  credits_per_unit: number
  unit: string
  description: string
  icon: string
  max_daily_claim: number
}

export interface GreenAction {
  id: string
  action_type: string
  quantity: number
  verification_status: 'pending' | 'verified' | 'rejected'
  trust_score: number | null
  credits_earned: number
  timestamp: string
  fraud_flags: string[]
}

export interface BalanceResponse {
  total_credits: number
  available_credits: number
  sold_credits: number
  reserved_credits: number
  inr_value: number
  tonnes_equivalent: number
}

export interface Recommendation {
  action_type: string
  projected_monthly_credits: number
  projected_monthly_inr: number
  difficulty_level: string
  getting_started_tip: string
  feasibility_score: number
}

export interface AdvisorPlan {
  cluster: string
  recommendations: Recommendation[]
  projected_monthly_credits: number
  projected_monthly_inr: number
}

export interface ForecastResponse {
  month_1: number
  month_2: number
  month_3: number
  inr_month_1: number
  inr_month_2: number
  inr_month_3: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  method: string
}

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; user_type?: string; city?: string }) =>
    api.post<LoginResponse>('/auth/register', data),
  login: (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password })
    return api.post<LoginResponse>('/auth/login', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get<User>('/auth/me'),
}

// ── Actions ──────────────────────────────────────────────
export const actionsApi = {
  getTypes:   () => api.get<ActionType[]>('/actions/types'),
  log:        (data: { action_type: string; quantity: number; proof_data?: object; notes?: string }) =>
                api.post('/actions/log', data),
  getHistory: (skip = 0, limit = 20) => api.get<GreenAction[]>(`/actions/history?skip=${skip}&limit=${limit}`),
}

// ── Credits ──────────────────────────────────────────────
export const creditsApi = {
  getBalance:  () => api.get<BalanceResponse>('/credits/balance'),
  getHistory:  (skip = 0, limit = 30) => api.get(`/credits/history?skip=${skip}&limit=${limit}`),
  withdraw:    (amount: number, bank_account: string) =>
                 api.post(`/credits/withdraw?amount=${amount}&bank_account=${bank_account}`),
}

// ── Advisor ──────────────────────────────────────────────
export const advisorApi = {
  getPlan:     () => api.get<AdvisorPlan>('/advisor/plan'),
  getForecast: (months = 3) => api.get<ForecastResponse>(`/advisor/forecast?months=${months}`),
  getPeers:    () => api.get('/advisor/peers'),
}

// ── Demo ─────────────────────────────────────────────────
export const demoApi = {
  run: () => api.post('/demo/run'),
}
