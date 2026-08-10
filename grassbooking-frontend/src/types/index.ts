export type RolUsuario = 'usuario' | 'admin_local' | 'super_admin';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: RolUsuario;
  idLocal?: number | null;
  createdAt?: string;
  mustChangePassword?: boolean;
}

export interface Local {
  id: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono: string;
  email?: string;
  imagenUrl?: string;
  fotos?: string[];
  estado: 'activo' | 'inactivo';
  createdAt?: string;
  canchas?: Cancha[];
  administradores?: Usuario[];
  descuentoPct?: number;
}

export interface ConfiguracionPago {
  moneda: string;
  aceptaEfectivo: boolean;
  culqiActivo: boolean;
  culqiPublicKey?: string | null;
  culqiSecretConfigurada?: boolean;
  yapeActivo: boolean;
  yapeQrUrl?: string | null;
  yapeTelefono?: string | null;
  descuentoPct?: number;
  adelantoPct?: number;
}

export type EstadoConexionMP = 'pendiente' | 'conectada' | 'desconectada' | 'error';

export interface EstadoMercadoPago {
  conectada: boolean;
  estado: EstadoConexionMP;
  mercadoPagoUserId: string | null;
  conectadoEn: string | null;
}

export interface ConfiguracionPagoPublica {
  moneda: string;
  aceptaEfectivo: boolean;
  culqiActivo: boolean;
  culqiPublicKey: string | null;
  yapeActivo: boolean;
  yapeQrUrl: string | null;
  yapeTelefono: string | null;
  descuentoPct: number;
  adelantoPct: number;
}

export interface Cancha {
  id: number;
  idLocal: number;
  nombre: string;
  deporte: string;
  tipoSuperficie: string;
  precioHoraDia: number;
  precioHoraNoche: number;
  horaInicioNoche: string;
  estado: 'activa' | 'inactiva';
  descripcion?: string;
  imagenUrl?: string;
  fotos?: string[];
  createdAt?: string;
  local?: Local;
  descuentoPct?: number;
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
  nombreCliente?: string;
  telefonoCliente?: string;
  createdAt: string;
  usuario?: Usuario;
  cancha?: Cancha;
  pago?: Pago;
}

export type EstadoPago = 'pendiente' | 'pagado' | 'reembolsado';
export type PasarelaPago = 'efectivo' | 'culqi' | 'mercadopago';

export interface Pago {
  id: number;
  idReserva: number;
  monto: number;
  metodoPago: string;
  pasarela: PasarelaPago;
  referenciaExterna?: string;
  estadoPago: EstadoPago;
  fechaPago?: string;
  reserva?: Reserva;
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
  pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  confirmada: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  cancelada: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  completada: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200',
  no_asistio: 'bg-ink-50 text-ink-500 ring-1 ring-inset ring-ink-200',
};

export const ESTADO_LABELS: Record<EstadoReserva, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_asistio: 'No asistió',
};
