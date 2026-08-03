import { useState, useEffect } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ReservaCard } from '../../components/reservas/ReservaCard';
import { reservasService } from '../../services/reservas.service';
import { pagosService } from '../../services/pagos.service';
import { Reserva, EstadoReserva, EstadoPago } from '../../types';

const ESTADOS_RESERVA: { value: EstadoReserva | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'confirmada', label: 'Confirmadas' },
  { value: 'cancelada', label: 'Canceladas' },
  { value: 'completada', label: 'Completadas' },
  { value: 'no_asistio', label: 'No asistió' },
];

const METODOS_PAGO = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];

export const ReservasAdminPage = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | 'todas'>('todas');
  const [filtroFecha, setFiltroFecha] = useState('');

  const [modalReserva, setModalReserva] = useState<Reserva | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReserva>('confirmada');
  const [estadoPago, setEstadoPago] = useState<EstadoPago>('pendiente');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [actualizando, setActualizando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargar = async () => {
    setIsLoading(true);
    try {
      const params: { fecha?: string; estado?: string } = {};
      if (filtroFecha) params.fecha = filtroFecha;
      if (filtroEstado !== 'todas') params.estado = filtroEstado;
      const res = await reservasService.getTodas(params);
      setReservas(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroEstado, filtroFecha]);

  const abrirModal = (reserva: Reserva) => {
    setModalReserva(reserva);
    setNuevoEstado(reserva.estado);
    setEstadoPago(reserva.pago?.estadoPago ?? 'pendiente');
    setMetodoPago(reserva.pago?.metodoPago ?? 'efectivo');
    setErrorModal('');
  };

  const handleGuardar = async () => {
    if (!modalReserva) return;
    setActualizando(true);
    setErrorModal('');

    try {
      await reservasService.cambiarEstado(modalReserva.id, nuevoEstado);

      if (modalReserva.pago?.id) {
        await pagosService.update(modalReserva.pago.id, estadoPago, metodoPago);
      }

      setModalReserva(null);
      cargar();
    } catch {
      setErrorModal('Error al guardar. Intenta de nuevo.');
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <main className="p-6 max-w-5xl">
          <h1 className="text-xl font-semibold text-ink-900 mb-6">Gestión de reservas</h1>

          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="input-field max-w-xs"
            />
            {filtroFecha && (
              <button onClick={() => setFiltroFecha('')} className="btn-secondary text-sm">
                Limpiar fecha
              </button>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap mb-6">
            {ESTADOS_RESERVA.map((e) => (
              <button
                key={e.value}
                onClick={() => setFiltroEstado(e.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filtroEstado === e.value
                    ? 'bg-ink-900 text-white'
                    : 'bg-white text-ink-600 border border-ink-200 hover:border-ink-300'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" text="Cargando reservas..." />
            </div>
          ) : reservas.length === 0 ? (
            <div className="card text-center py-12 text-ink-400">
              <ClipboardList className="mx-auto mb-3" size={28} strokeWidth={1.5} />
              <p className="text-sm">No hay reservas con este filtro</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservas.map((reserva) => (
                <ReservaCard
                  key={reserva.id}
                  reserva={reserva}
                  showUsuario
                  onCambiarEstado={abrirModal}
                />
              ))}
            </div>
          )}
        </main>
        </div>
      </div>

      {modalReserva && (
        <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-ink-100">

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-ink-900">Gestionar reserva</h3>
              <button onClick={() => setModalReserva(null)} className="text-ink-400 hover:text-ink-700">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            <div className="bg-ink-50 rounded-md p-3 mb-5 text-sm space-y-1">
              <p className="text-ink-500">
                Código: <span className="font-mono font-medium text-ink-700">
                  #{modalReserva.codigoReserva?.slice(0, 8).toUpperCase()}
                </span>
              </p>
              <p className="text-ink-500">
                Cliente: <span className="font-medium text-ink-700">
                  {modalReserva.usuario?.nombre ?? '—'}
                </span>
              </p>
              <p className="text-ink-500">
                Fecha: <span className="font-medium text-ink-700">
                  {modalReserva.fechaReserva} · {modalReserva.horaInicio.substring(0, 5)}–{modalReserva.horaFin.substring(0, 5)}
                </span>
              </p>
              <p className="text-ink-500">
                Monto: <span className="font-semibold text-ink-900">
                  S/ {Number(modalReserva.montoTotal).toFixed(2)}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Estado de la reserva
              </label>
              <select
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value as EstadoReserva)}
                className="input-field"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
                <option value="completada">Completada</option>
                <option value="no_asistio">No asistió</option>
              </select>
            </div>

            <div className="border-t border-ink-100 my-4" />

            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                Estado del pago
              </label>
              <div className="flex gap-2">
                {(['pendiente', 'pagado', 'reembolsado'] as EstadoPago[]).map((ep) => (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => setEstadoPago(ep)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      estadoPago === ep
                        ? 'bg-ink-900 text-white border-ink-900'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    {ep === 'pendiente' ? 'Pendiente' : ep === 'pagado' ? 'Pagado' : 'Reembolsado'}
                  </button>
                ))}
              </div>
            </div>

            {estadoPago === 'pagado' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Método de pago
                </label>
                <div className="flex flex-wrap gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodoPago(m)}
                      className={`px-3 py-1.5 rounded-md text-sm capitalize border transition-colors ${
                        metodoPago === m
                          ? 'bg-ink-900 text-white border-ink-900'
                          : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errorModal && (
              <p className="text-red-600 text-sm mb-3">{errorModal}</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleGuardar}
                disabled={actualizando}
                className="flex-1 btn-primary py-2.5"
              >
                {actualizando ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Guardando...
                  </span>
                ) : (
                  'Guardar cambios'
                )}
              </button>
              <button
                onClick={() => setModalReserva(null)}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
