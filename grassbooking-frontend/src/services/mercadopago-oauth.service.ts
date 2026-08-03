import api from './api';
import { ApiResponse, EstadoMercadoPago } from '../types';

export const mercadoPagoOauthService = {
  async iniciarConexion() {
    const res = await api.get<ApiResponse<{ authorizationUrl: string }>>(
      '/pagos/mercadopago/oauth/connect',
    );
    return res.data;
  },

  async obtenerEstado() {
    const res = await api.get<ApiResponse<EstadoMercadoPago>>('/pagos/mercadopago/oauth/status');
    return res.data;
  },

  async obtenerEstadoPublico(idLocal: number) {
    const res = await api.get<ApiResponse<{ conectada: boolean }>>(
      `/pagos/mercadopago/oauth/publico/${idLocal}`,
    );
    return res.data;
  },

  async desconectar() {
    const res = await api.post<ApiResponse<null>>('/pagos/mercadopago/oauth/disconnect');
    return res.data;
  },
};
