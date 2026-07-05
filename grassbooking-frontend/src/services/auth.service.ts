import api from './api';
import { LoginCredentials, RegisterData, ApiResponse, Usuario } from '../types';

interface LoginResponseData {
  token: string;
  usuario: Usuario;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const res = await api.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return res.data;
  },

  async register(data: RegisterData) {
    const res = await api.post<ApiResponse<Usuario>>('/auth/register', data);
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getPerfil() {
    const res = await api.get<ApiResponse<Usuario>>('/auth/perfil');
    return res.data;
  },
};
