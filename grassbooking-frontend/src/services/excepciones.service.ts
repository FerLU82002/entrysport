import api from './api';
import { ApiResponse, HorarioExcepcion } from '../types';

export const excepcionesService = {
  getByFecha: (canchaId: number, fecha: string) =>
    api.get<ApiResponse<HorarioExcepcion[]>>(
      `/excepciones?canchaId=${canchaId}&fecha=${fecha}`,
    ),

  create: (data: {
    idCancha: number;
    fecha: string;
    horaInicio?: string;
    horaFin?: string;
    disponible?: boolean;
    motivo?: string;
  }) => api.post<ApiResponse<HorarioExcepcion>>('/excepciones', data),

  remove: (id: number) => api.delete(`/excepciones/${id}`),
};
