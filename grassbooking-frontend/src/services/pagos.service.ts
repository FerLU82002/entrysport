import api from './api';
import { ApiResponse, Pago, EstadoPago } from '../types';

export const pagosService = {
  async getByReserva(idReserva: number) {
    const res = await api.get<ApiResponse<Pago>>(`/pagos/reserva/${idReserva}`);
    return res.data;
  },

  async getPorLocal() {
    const res = await api.get<ApiResponse<Pago[]>>('/pagos');
    return res.data;
  },

  async update(id: number, estadoPago: EstadoPago, metodoPago?: string) {
    const res = await api.patch<ApiResponse<Pago>>(`/pagos/${id}`, {
      estadoPago,
      ...(metodoPago ? { metodoPago } : {}),
    });
    return res.data;
  },

  async pagarConCulqi(idReserva: number, tokenId: string, email?: string) {
    const res = await api.post<ApiResponse<Pago>>(`/pagos/reserva/${idReserva}/culqi`, {
      tokenId,
      email,
    });
    return res.data;
  },

  async pagarConMercadoPago(idReserva: number) {
    const res = await api.post<ApiResponse<{ initPoint: string; preferenceId: string }>>(
      `/pagos/reserva/${idReserva}/mercadopago`,
    );
    return res.data;
  },
};
