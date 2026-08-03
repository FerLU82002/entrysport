const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
/** Origen del backend sin el prefijo /api (las imágenes se sirven en /uploads, fuera de /api). */
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Convierte una ruta relativa devuelta por el backend (/uploads/...) en una URL absoluta. */
export const urlImagen = (ruta: string): string => {
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${BACKEND_ORIGIN}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
};
