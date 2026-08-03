import api from './api';
import { ApiResponse } from '../types';

export const uploadsService = {
  async subirImagen(archivo: File) {
    const formData = new FormData();
    formData.append('imagen', archivo);

    const res = await api.post<ApiResponse<{ url: string }>>('/uploads/imagen', formData, {
      // Se deja que el navegador arme el boundary del multipart; si forzamos
      // 'application/json' (el default de esta instancia) el backend no puede parsearlo.
      headers: { 'Content-Type': undefined },
    });
    return res.data;
  },
};
