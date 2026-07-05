import api from './api';
import { ApiResponse, Cancha } from '../types';

export const canchasService = {
  async getAll(soloActivas = true) {
    const params = soloActivas ? {} : { todas: 'true' };
    const res = await api.get<ApiResponse<Cancha[]>>('/canchas', { params });
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<Cancha>>(`/canchas/${id}`);
    return res.data;
  },

  async create(data: Partial<Cancha>) {
    const res = await api.post<ApiResponse<Cancha>>('/canchas', data);
    return res.data;
  },

  async update(id: number, data: Partial<Cancha>) {
    const res = await api.patch<ApiResponse<Cancha>>(`/canchas/${id}`, data);
    return res.data;
  },

  async remove(id: number) {
    const res = await api.delete<ApiResponse<null>>(`/canchas/${id}`);
    return res.data;
  },
};
