import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://137.131.151.125:3001/api',
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@CozinhaPlus:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com tokens expirados ou inválidos (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se der 401, removemos os dados do usuário e redirecionamos para login
      localStorage.removeItem('@CozinhaPlus:token');
      localStorage.removeItem('@CozinhaPlus:user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
