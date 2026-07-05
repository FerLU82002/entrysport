import api from './api';
import {
  ApiResponse,
  ResumenReportes,
  DatoOcupacion,
  DatoIngreso,
} from '../types';

export const reportesService = {
  async getOcupacion(desde: string, hasta: string) {
    const res = await api.get<ApiResponse<DatoOcupacion[]>>('/reportes/ocupacion', {
      params: { desde, hasta },
    });
    return res.data;
  },

  async getIngresos(desde: string, hasta: string) {
    const res = await api.get<ApiResponse<DatoIngreso[]>>('/reportes/ingresos', {
      params: { desde, hasta },
    });
    return res.data;
  },

  async getResumen(desde: string, hasta: string) {
    const res = await api.get<ApiResponse<ResumenReportes>>('/reportes/reservas', {
      params: { desde, hasta },
    });
    return res.data;
  },
};
