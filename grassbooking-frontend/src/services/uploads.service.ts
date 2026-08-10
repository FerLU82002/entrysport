import api from './api';
import { ApiResponse } from '../types';

export const uploadsService = {
  async subirImagen(archivo: File) {
    const formData = new FormData();
    formData.append('imagen', archivo);

    const res = await api.post<ApiResponse<{ url: string }>>('/uploads/imagen', formData, {
      // Content-Type must NOT be set so XHR/fetch sets multipart/form-data with boundary.
      // timeout override: 15 s (api default) is too short for 5 MB on slow connections.
      headers: { 'Content-Type': undefined as unknown as string },
      timeout: 120_000,
    });
    return res.data;
  },
};
