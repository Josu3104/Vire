import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api';
const baseURL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, '')}/api`;

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de REQUEST: inyecta JWT ──
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // El prefijo /api ya es manejado por el baseURL de Axios.
  
  return config;
});

// ── Interceptor de RESPONSE: maneja 401 (sesión expirada) ──
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
