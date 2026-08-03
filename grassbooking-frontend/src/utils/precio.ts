import { Cancha } from '../types';

export const esHorarioNocturno = (horaInicio: string, cancha: Cancha) =>
  horaInicio.substring(0, 5) >= cancha.horaInicioNoche.substring(0, 5);

export const precioParaHora = (cancha: Cancha, horaInicio: string) =>
  esHorarioNocturno(horaInicio, cancha)
    ? Number(cancha.precioHoraNoche)
    : Number(cancha.precioHoraDia);
