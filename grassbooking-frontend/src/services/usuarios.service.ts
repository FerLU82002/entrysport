import api from './api';
import { ApiResponse, Usuario } from '../types';

export const usuariosService = {
  async getAll() {
    const res = await api.get<ApiResponse<Usuario[]>>('/usuarios');
    return res.data;
  },

  async crearAdminLocal(data: {
    nombre: string;
    email: string;
    telefono?: string;
    password: string;
  }) {
    const res = await api.post<ApiResponse<Usuario>>('/usuarios/admin-local', data);
    return res.data;
  },
};
