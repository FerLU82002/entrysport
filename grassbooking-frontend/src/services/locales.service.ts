import api from './api';
import { ApiResponse, ConfiguracionPago, ConfiguracionPagoPublica, Local } from '../types';

export const localesService = {
  async getAll() {
    const res = await api.get<ApiResponse<Local[]>>('/locales');
    return res.data;
  },

  async getAllAdmin() {
    const res = await api.get<ApiResponse<Local[]>>('/locales/admin');
    return res.data;
  },

  async getById(id: number) {
    const res = await api.get<ApiResponse<Local>>(`/locales/${id}`);
    return res.data;
  },

  async getMiLocal() {
    const res = await api.get<ApiResponse<Local>>('/locales/mi-local');
    return res.data;
  },

  async crearMiLocal(data: Partial<Local>) {
    const res = await api.post<ApiResponse<Local>>('/locales/mi-local', data);
    return res.data;
  },

  async actualizarMiLocal(data: Partial<Local>) {
    const res = await api.patch<ApiResponse<Local>>('/locales/mi-local', data);
    return res.data;
  },

  async crear(data: Partial<Local>) {
    const res = await api.post<ApiResponse<Local>>('/locales', data);
    return res.data;
  },

  async actualizarEstado(id: number, estado: 'activo' | 'inactivo') {
    const res = await api.patch<ApiResponse<Local>>(`/locales/${id}`, { estado });
    return res.data;
  },

  async getMiConfigPago() {
    const res = await api.get<ApiResponse<ConfiguracionPago>>('/locales/mi-local/config-pago');
    return res.data;
  },

  async actualizarMiConfigPago(data: Partial<{
    moneda: string;
    aceptaEfectivo: boolean;
    culqiActivo: boolean;
    culqiPublicKey: string;
    culqiSecretKey: string;
    yapeActivo: boolean;
    yapeQrUrl: string;
    yapeTelefono: string;
    descuentoPct: number;
    adelantoPct: number;
  }>) {
    const res = await api.patch<ApiResponse<ConfiguracionPago>>(
      '/locales/mi-local/config-pago',
      data,
    );
    return res.data;
  },

  async getConfigPagoPublica(idLocal: number) {
    const res = await api.get<ApiResponse<ConfiguracionPagoPublica>>(
      `/locales/${idLocal}/config-pago/publica`,
    );
    return res.data;
  },
};
