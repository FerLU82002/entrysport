import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { CheckCircle2, AlertTriangle, Landmark } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import { Navbar } from '../../components/common/Navbar';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { SubidaFotos } from '../../components/common/SubidaFotos';
import { localesService } from '../../services/locales.service';
import { mercadoPagoOauthService } from '../../services/mercadopago-oauth.service';
import { useAuth } from '../../hooks/useAuth';
import { ConfiguracionPago, EstadoMercadoPago, Local } from '../../types';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  descripcion: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().min(6, 'Ingresa un número de contacto válido').max(20),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  imagenUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export const MiLocalPage = () => {
  const { usuario } = useAuth();
  const [local, setLocal] = useState<Local | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', direccion: '', telefono: '', email: '', imagenUrl: '' },
  });

  const cargar = () => {
    setIsLoading(true);
    localesService
      .getMiLocal()
      .then((res) => {
        setLocal(res.data);
        reset({
          nombre: res.data.nombre,
          descripcion: res.data.descripcion || '',
          direccion: res.data.direccion || '',
          telefono: res.data.telefono,
          email: res.data.email || '',
          imagenUrl: res.data.imagenUrl || '',
        });
        setFotos(res.data.fotos || []);
      })
      .catch(() => setLocal(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(cargar, [usuario?.idLocal]);

  const onSubmit = async (data: FormData) => {
    setGuardando(true);
    setError('');
    setExito('');
    try {
      const payload = { ...data, email: data.email || undefined, imagenUrl: data.imagenUrl || undefined, fotos };
      const res = local
        ? await localesService.actualizarMiLocal(payload)
        : await localesService.crearMiLocal(payload);
      setLocal(res.data);
      setExito('Datos guardados correctamente');
      window.location.reload();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error al guardar' : 'Error inesperado');
    } finally {
      setGuardando(false);
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
          <main className="p-6 max-w-3xl">
            <h1 className="text-xl font-semibold text-ink-900 mb-1">Mi local</h1>
            <p className="text-sm text-ink-500 mb-6">
              {local
                ? 'Datos de contacto y presentación de tu complejo deportivo.'
                : 'Aún no has registrado tu local. Completa estos datos para empezar a publicar tus espacios deportivos.'}
            </p>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Cargando..." />
              </div>
            ) : (
              <>
                <div className="card mb-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre del local</label>
                      <input {...register('nombre')} className="input-field" placeholder="Complejo Deportivo Los Andes" />
                      {errors.nombre && <p className="text-red-600 text-xs mt-1">{errors.nombre.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Descripción</label>
                      <textarea {...register('descripcion')} rows={3} className="input-field resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Dirección</label>
                        <input {...register('direccion')} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono de contacto</label>
                        <input {...register('telefono')} className="input-field" placeholder="987654321" />
                        {errors.telefono && <p className="text-red-600 text-xs mt-1">{errors.telefono.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Email de contacto</label>
                        <input {...register('email')} className="input-field" />
                        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">URL de imagen de portada</label>
                        <input {...register('imagenUrl')} className="input-field" placeholder="https://..." />
                        {errors.imagenUrl && <p className="text-red-600 text-xs mt-1">{errors.imagenUrl.message}</p>}
                      </div>
                    </div>

                    <SubidaFotos fotos={fotos} onChange={setFotos} label="Fotos del local" />

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {exito && <p className="text-brand-700 text-sm">{exito}</p>}

                    <button type="submit" disabled={guardando} className="btn-primary">
                      {guardando ? (
                        <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Guardando...</span>
                      ) : local ? 'Guardar cambios' : 'Registrar mi local'}
                    </button>
                  </form>
                </div>

                {local && <MercadoPagoConexionCard />}
                {local && <ConfigPagoCard />}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const ConfigPagoCard = () => {
  const [config, setConfig] = useState<ConfiguracionPago | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [aceptaEfectivo, setAceptaEfectivo] = useState(true);
  const [culqiActivo, setCulqiActivo] = useState(false);
  const [culqiPublicKey, setCulqiPublicKey] = useState('');
  const [culqiSecretKey, setCulqiSecretKey] = useState('');
  const [yapeActivo, setYapeActivo] = useState(false);
  const [yapeQr, setYapeQr] = useState<string[]>([]);
  const [yapeTelefono, setYapeTelefono] = useState('');

  useEffect(() => {
    localesService
      .getMiConfigPago()
      .then((res) => {
        setConfig(res.data);
        setAceptaEfectivo(res.data.aceptaEfectivo);
        setCulqiActivo(res.data.culqiActivo);
        setCulqiPublicKey(res.data.culqiPublicKey || '');
        setYapeActivo(res.data.yapeActivo);
        setYapeQr(res.data.yapeQrUrl ? [res.data.yapeQrUrl] : []);
        setYapeTelefono(res.data.yapeTelefono || '');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const guardar = async () => {
    setGuardando(true);
    setError('');
    setExito('');
    try {
      const res = await localesService.actualizarMiConfigPago({
        aceptaEfectivo,
        culqiActivo,
        culqiPublicKey: culqiPublicKey || undefined,
        culqiSecretKey: culqiSecretKey || undefined,
        yapeActivo,
        yapeQrUrl: yapeQr[0] || '',
        yapeTelefono: yapeTelefono || undefined,
      });
      setConfig(res.data);
      setCulqiSecretKey('');
      setExito('Configuración de pagos actualizada');
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error al guardar' : 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card flex justify-center py-8">
        <LoadingSpinner text="Cargando configuración de pagos..." />
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-ink-900 mb-1">Efectivo, Yape y Culqi</h2>
      <p className="text-xs text-ink-400 mb-4">
        Culqi cobra directo a tu cuenta (sin comisión de la plataforma). Las llaves secretas se guardan cifradas.
        Para Mercado Pago usa la tarjeta de arriba — es una conexión distinta (split de pagos).
      </p>

      <label className="flex items-center gap-2 mb-5">
        <input type="checkbox" checked={aceptaEfectivo} onChange={(e) => setAceptaEfectivo(e.target.checked)} />
        <span className="text-sm text-ink-700">Aceptar pago en efectivo al llegar</span>
      </label>

      <div className="border-t border-ink-100 pt-4 mb-4">
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" checked={yapeActivo} onChange={(e) => setYapeActivo(e.target.checked)} />
          <span className="text-sm font-medium text-ink-800">Habilitar Yape</span>
        </label>
        {yapeActivo && (
          <div className="pl-6 space-y-3">
            <p className="text-xs text-ink-400">
              Sube la foto de tu QR de Yape e indica tu número. Cuando un cliente pague, verá el QR y un botón
              para enviarte el comprobante por WhatsApp a este mismo número con los datos de su reserva.
            </p>
            <div className="max-w-xs">
              <label className="block text-xs text-ink-500 mb-1">Número de celular (Yape y WhatsApp)</label>
              <input
                value={yapeTelefono}
                onChange={(e) => setYapeTelefono(e.target.value)}
                placeholder="987654321"
                className="input-field text-sm"
              />
            </div>
            <SubidaFotos fotos={yapeQr} onChange={setYapeQr} maxFotos={1} label="Foto del QR de Yape" />
          </div>
        )}
      </div>

      <div className="border-t border-ink-100 pt-4 mb-4">
        <label className="flex items-center gap-2 mb-3">
          <input type="checkbox" checked={culqiActivo} onChange={(e) => setCulqiActivo(e.target.checked)} />
          <span className="text-sm font-medium text-ink-800">Habilitar Culqi</span>
        </label>
        {culqiActivo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Llave pública (pk_...)</label>
              <input value={culqiPublicKey} onChange={(e) => setCulqiPublicKey(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">
                Llave secreta (sk_...) {config?.culqiSecretConfigurada && <span className="text-brand-600">configurada</span>}
              </label>
              <input
                value={culqiSecretKey}
                onChange={(e) => setCulqiSecretKey(e.target.value)}
                type="password"
                placeholder={config?.culqiSecretConfigurada ? '••••••••' : ''}
                className="input-field text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {exito && <p className="text-brand-700 text-sm mb-3">{exito}</p>}

      <button onClick={guardar} disabled={guardando} className="btn-primary">
        {guardando ? <span className="flex items-center gap-2"><LoadingSpinner size="sm" /> Guardando...</span> : 'Guardar configuración de pagos'}
      </button>
    </div>
  );
};

const MercadoPagoConexionCard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [estado, setEstado] = useState<EstadoMercadoPago | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [desconectando, setDesconectando] = useState(false);
  const [error, setError] = useState('');

  const resultadoCallback = searchParams.get('mercadopago');

  const cargar = () => {
    setIsLoading(true);
    mercadoPagoOauthService
      .obtenerEstado()
      .then((res) => setEstado(res.data))
      .catch(() => setEstado(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(cargar, []);

  useEffect(() => {
    if (resultadoCallback) {
      cargar();
      // Limpia el query param para que un refresh no repita el mensaje.
      searchParams.delete('mercadopago');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadoCallback]);

  const conectar = async () => {
    setConectando(true);
    setError('');
    try {
      const res = await mercadoPagoOauthService.iniciarConexion();
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error al conectar' : 'Error inesperado');
      setConectando(false);
    }
  };

  const desconectar = async () => {
    if (!confirm('¿Desconectar tu cuenta de Mercado Pago? No podrás recibir pagos en línea por MP hasta reconectarla.')) return;
    setDesconectando(true);
    setError('');
    try {
      await mercadoPagoOauthService.desconectar();
      cargar();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || 'Error al desconectar' : 'Error inesperado');
    } finally {
      setDesconectando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card mb-6 flex justify-center py-8">
        <LoadingSpinner text="Cargando estado de Mercado Pago..." />
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <h2 className="text-sm font-semibold text-ink-900 mb-1">Mercado Pago — pagos con reparto automático</h2>
      <p className="text-xs text-ink-400 mb-4">
        Conecta tu cuenta de Mercado Pago con OAuth. Cada reserva pagada por esta vía se reparte
        automáticamente: la comisión de la plataforma se descuenta y el resto se acredita directo a tu cuenta.
      </p>

      {resultadoCallback === 'conectado' && (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-800 px-4 py-3 rounded-md mb-4 text-sm">
          <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0" />
          Tu cuenta de Mercado Pago quedó conectada.
        </div>
      )}
      {resultadoCallback === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
          <AlertTriangle size={16} strokeWidth={1.75} className="shrink-0" />
          No se pudo completar la conexión con Mercado Pago. Intenta nuevamente.
        </div>
      )}

      {estado?.conectada ? (
        <div className="flex items-center justify-between bg-ink-50 border border-ink-200 rounded-md px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Landmark size={18} strokeWidth={1.75} className="text-ink-500" />
            <div>
              <p className="text-sm text-ink-900 font-medium">Cuenta conectada</p>
              <p className="text-xs text-ink-500">ID Mercado Pago: {estado.mercadoPagoUserId}</p>
            </div>
          </div>
          <button onClick={desconectar} disabled={desconectando} className="btn-secondary text-sm shrink-0">
            {desconectando ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 bg-ink-50 border border-ink-200 rounded-md px-4 py-3">
          <p className="text-sm text-ink-600">
            {estado?.estado === 'error'
              ? 'Hubo un problema con tu conexión anterior. Reconéctala.'
              : 'Aún no conectaste tu cuenta de Mercado Pago.'}
          </p>
          <button onClick={conectar} disabled={conectando} className="btn-primary text-sm shrink-0">
            {conectando ? 'Redirigiendo...' : 'Conectar'}
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
};
