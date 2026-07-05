import api from './api';
import { ApiResponse, Reserva, DisponibilidadResponse, EstadoReserva } from '../types';

interface CreateReservaPayload {
  idCancha: number;
  fechaReserva: string;
  horaInicio: string;
  notas?: string;
}

export const reservasService = {
  async getMisReservas() {
    const res = await api.get<ApiResponse<Reserva[]>>('/reservas');
    return res.data;
  },

  async getTodas(params?: { fecha?: string; estado?: string; idCancha?: number }) {
    const res = await api.get<ApiResponse<Reserva[]>>('/reservas/todas', { params });
    return res.data;
  },

  async getHoy() {
    const res = await api.get<ApiResponse<Reserva[]>>('/reservas/hoy');
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<Reserva>>(`/reservas/${id}`);
    return res.data;
  },

  async create(data: CreateReservaPayload) {
    const res = await api.post<ApiResponse<Reserva>>('/reservas', data);
    return res.data;
  },

  async cancelar(id: number) {
    const res = await api.patch<ApiResponse<Reserva>>(`/reservas/${id}/cancelar`);
    return res.data;
  },

  async cambiarEstado(id: number, estado: EstadoReserva, notas?: string) {
    const res = await api.patch<ApiResponse<Reserva>>(`/reservas/${id}/estado`, {
      estado,
      notas,
    });
    return res.data;
  },

  async getDisponibilidad(idCancha: number, fecha: string) {
    const res = await api.get<ApiResponse<DisponibilidadResponse>>(
      '/horarios/disponibilidad',
      { params: { id_cancha: idCancha, fecha } },
    );
    return res.data;
  },
};
