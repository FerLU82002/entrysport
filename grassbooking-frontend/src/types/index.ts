export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'usuario' | 'admin';
  createdAt?: string;
}

export interface Cancha {
  id: number;
  nombre: string;
  tipoSuperficie: string;
  precioHora: number;
  estado: 'activa' | 'inactiva';
  descripcion?: string;
  imagenUrl?: string;
  createdAt?: string;
}

export interface Horario {
  id: number;
  idCancha: number;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface SlotDisponibilidad {
  id: number;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export interface DisponibilidadResponse {
  fecha: string;
  diaSemana: DiaSemana;
  slots: SlotDisponibilidad[];
}

export type EstadoReserva =
  | 'pendiente'
  | 'confirmada'
  | 'cancelada'
  | 'completada'
  | 'no_asistio';

export interface Reserva {
  id: number;
  idUsuario: number;
  idCancha: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
  montoTotal: number;
  codigoReserva: string;
  notas?: string;
  createdAt: string;
  usuario?: Usuario;
  cancha?: Cancha;
  pago?: Pago;
}

export type EstadoPago = 'pendiente' | 'pagado' | 'reembolsado';

export interface Pago {
  id: number;
  idReserva: number;
  monto: number;
  metodoPago: string;
  estadoPago: EstadoPago;
  fechaPago?: string;
}

export type TipoNotificacion =
  | 'confirmacion'
  | 'cancelacion'
  | 'recordatorio'
  | 'modificacion';

export interface Notificacion {
  id: number;
  idUsuario: number;
  idReserva?: number;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export interface HorarioExcepcion {
  id: number;
  idCancha: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  disponible: boolean;
  motivo?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nombre: string;
  email: string;
  telefono?: string;
  password: string;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ResumenReportes {
  total: number;
  confirmadas: number;
  canceladas: number;
  completadas: number;
  pendientes: number;
  noAsistio: number;
  montoTotalGenerado: number;
  ingresosCobrados: number;
}

export interface DatoOcupacion {
  fecha: string;
  totalReservas: number;
  reservasActivas: number;
  porcentajeOcupacion: number;
}

export interface DatoIngreso {
  semana: string;
  totalIngresos: number;
  totalPagos: number;
}

export const ESTADO_COLORES: Record<EstadoReserva, string> = {
  pendiente: 'bg-orange-100 text-orange-800',
  confirmada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  completada: 'bg-blue-100 text-blue-800',
  no_asistio: 'bg-gray-100 text-gray-800',
};

export const ESTADO_LABELS: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};
