import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LandPlot } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CalendarioDisponibilidad } from '../../components/reservas/CalendarioDisponibilidad';
import { ConfirmacionReserva } from '../../components/reservas/ConfirmacionReserva';
import { PagoModal } from '../../components/reservas/PagoModal';
import { canchasService } from '../../services/canchas.service';
import { reservasService } from '../../services/reservas.service';
import { localesService } from '../../services/locales.service';
import { useAuth } from '../../hooks/useAuth';
import { urlImagen } from '../../utils/media';
import { Cancha, ConfiguracionPagoPublica, Reserva, SlotDisponibilidad } from '../../types';
import { format, addDays } from 'date-fns';
import axios from 'axios';

export const ReservaPage = () => {
  const { idCancha } = useParams<{ idCancha: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [cancha, setCancha] = useState<Cancha | null>(null);
  const [configPublica, setConfigPublica] = useState<ConfiguracionPagoPublica | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    searchParams.get('fecha') || format(new Date(), 'yyyy-MM-dd'),
  );
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponibilidad | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReservando, setIsReservando] = useState(false);
  const [error, setError] = useState('');
  const [reservaPorPagar, setReservaPorPagar] = useState<Reserva | null>(null);

  const fechaMin = format(new Date(), 'yyyy-MM-dd');
  const fechaMax = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  useEffect(() => {
    if (!idCancha) return;
    canchasService
      .getById(Number(idCancha))
      .then((res) => {
        setCancha(res.data);
        return localesService.getConfigPagoPublica(res.data.idLocal);
      })
      .then((cfg) => setConfigPublica(cfg.data))
      .catch(() => navigate('/canchas'))
      .finally(() => setIsLoading(false));
  }, [idCancha, navigate]);

  // Si volvemos de iniciar sesión/registrarnos con un horario ya elegido
  // (?fecha=&hora=), lo recuperamos y reabrimos la confirmación directamente.
  useEffect(() => {
    const horaDeseada = searchParams.get('hora');
    if (!idCancha || !horaDeseada) return;

    reservasService
      .getDisponibilidad(Number(idCancha), fechaSeleccionada)
      .then((res) => {
        const slot = res.data.slots.find((s) => s.horaInicio === horaDeseada);
        if (slot?.disponible) {
          setSlotSeleccionado(slot);
          setMostrarConfirmacion(true);
        }
      })
      .catch(() => {});
    // Solo al montar: no repetir mientras el usuario navega manualmente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCancha]);

  const construirUrlActual = () => {
    if (!slotSeleccionado) return `/reservar/${idCancha}`;
    return `/reservar/${idCancha}?fecha=${fechaSeleccionada}&hora=${slotSeleccionado.horaInicio}`;
  };

  const handleConfirmar = async (notas?: string) => {
    if (!cancha || !slotSeleccionado) return;

    setIsReservando(true);
    setError('');

    try {
      const res = await reservasService.create({
        idCancha: cancha.id,
        fechaReserva: fechaSeleccionada,
        horaInicio: slotSeleccionado.horaInicio,
        notas,
      });
      setMostrarConfirmacion(false);
      setReservaPorPagar(res.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Error al crear la reserva');
      } else {
        setError('Error inesperado');
      }
    } finally {
      setIsReservando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Cargando cancha..." />
        </div>
      </div>
    );
  }

  if (!cancha) return null;

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/canchas')}
          className="text-ink-500 hover:text-ink-900 text-sm mb-4 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Volver a canchas
        </button>

        <div className="card mb-6">
          <div className="flex items-start gap-4">
            {cancha.imagenUrl ? (
              <img
                src={urlImagen(cancha.imagenUrl)}
                alt={cancha.nombre}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-ink-100 rounded-lg flex items-center justify-center text-ink-300">
                <LandPlot size={24} strokeWidth={1.5} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-ink-900">{cancha.nombre}</h1>
              <p className="text-ink-500 text-sm">{cancha.deporte} · {cancha.tipoSuperficie}</p>
              <p className="text-ink-900 font-semibold mt-1">
                S/ {Number(cancha.precioHoraDia).toFixed(2)} – S/ {Number(cancha.precioHoraNoche).toFixed(2)}
                <span className="text-ink-400 font-normal text-sm"> / hora</span>
              </p>
            </div>
          </div>

          {cancha.fotos && cancha.fotos.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {cancha.fotos.map((foto) => (
                <img
                  key={foto}
                  src={urlImagen(foto)}
                  alt={cancha.nombre}
                  className="w-20 h-20 rounded-md object-cover shrink-0 border border-ink-100"
                />
              ))}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ink-900 text-white text-xs">1</span>
            Selecciona la fecha
          </h2>
          <input
            type="date"
            value={fechaSeleccionada}
            min={fechaMin}
            max={fechaMax}
            onChange={(e) => {
              setFechaSeleccionada(e.target.value);
              setSlotSeleccionado(null);
            }}
            className="input-field max-w-xs"
          />
        </div>

        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-ink-900 text-white text-xs">2</span>
            Selecciona el horario
          </h2>
          <CalendarioDisponibilidad
            idCancha={cancha.id}
            fecha={fechaSeleccionada}
            slotSeleccionado={slotSeleccionado}
            onSeleccionar={(slot) => {
              setSlotSeleccionado(slot);
              setMostrarConfirmacion(true);
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {mostrarConfirmacion && slotSeleccionado && (
          <ConfirmacionReserva
            cancha={cancha}
            fecha={fechaSeleccionada}
            slot={slotSeleccionado}
            isLoading={isReservando}
            estaAutenticado={isAuthenticated}
            configPublica={configPublica}
            onConfirmar={handleConfirmar}
            onCancelar={() => {
              setMostrarConfirmacion(false);
              setSlotSeleccionado(null);
            }}
            onRequiereLogin={() => navigate('/login', { state: { from: construirUrlActual() } })}
            onRequiereRegistro={() => navigate('/register', { state: { from: construirUrlActual() } })}
          />
        )}

        {reservaPorPagar && (
          <PagoModal
            reserva={reservaPorPagar}
            onClose={() => navigate('/mis-reservas', { state: { reservaCreada: true } })}
            onPagado={() => navigate('/mis-reservas', { state: { reservaCreada: true } })}
          />
        )}
      </main>
    </div>
  );
};
