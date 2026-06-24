import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL 
                     || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('greencoin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally (token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('greencoin_token');
      localStorage.removeItem('greencoin_user');
      window.location.href = '/onboarding';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
