import api from './api';
import { ApiResponse, Pago, EstadoPago } from '../types';

export const pagosService = {
  async getByReserva(idReserva: number) {
    const res = await api.get<ApiResponse<Pago>>(`/pagos/reserva/${idReserva}`);
    return res.data;
  },

  async update(id: number, estadoPago: EstadoPago, metodoPago?: string) {
    const res = await api.patch<ApiResponse<Pago>>(`/pagos/${id}`, {
      estadoPago,
      ...(metodoPago ? { metodoPago } : {}),
    });
    return res.data;
  },
};
