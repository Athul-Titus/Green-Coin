import apiClient from './client';

export interface RegisterData {
  full_name:         string;
  email:             string;
  password:          string;
  user_type?:        string;
  location?:         string;
  neighborhood_type?: string;
  commute_type?:     string;
  diet_type?:        string;
  has_solar?:        boolean;
  has_led?:          boolean;
  has_smart_meter?:  boolean;
  has_ev_charger?:   boolean;
}

export interface LoginData {
  email:    string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type:   string;
  user_id:      string;
  full_name:    string;
  email:        string;
  user_type:    string;
}

export const authAPI = {

  register: async (data: RegisterData): 
    Promise<AuthResponse> => {
    const response = await apiClient.post(
      '/auth/register', data
    );
    // Save token and user to localStorage
    localStorage.setItem(
      'greencoin_token',
      response.data.access_token
    );
    localStorage.setItem(
      'greencoin_user',
      JSON.stringify(response.data)
    );
    return response.data;
  },

  login: async (data: LoginData): 
    Promise<AuthResponse> => {
    const response = await apiClient.post(
      '/auth/login', data
    );
    localStorage.setItem(
      'greencoin_token',
      response.data.access_token
    );
    localStorage.setItem(
      'greencoin_user',
      JSON.stringify(response.data)
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('greencoin_token');
    localStorage.removeItem('greencoin_user');
    window.location.href = '/';
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('greencoin_token');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('greencoin_user');
    return user ? JSON.parse(user) : null;
  }
};
