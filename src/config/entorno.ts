/**
 * Variables de entorno de la aplicación, leídas y validadas en un solo lugar.
 *
 * Las `VITE_*` se fijan al compilar: cambiarlas en Vercel exige volver a
 * desplegar. Un valor no reconocido no rompe el arranque: se sustituye por
 * el valor por defecto.
 */

import { z } from 'zod';

const esquema = z.object({
  /** Fuente de datos: `local` (navegador) o `http` (API). */
  VITE_DATA_SOURCE: z.enum(['local', 'http']).catch('local'),
  /**
   * Raíz de la API, sin barra final. Por defecto `/api`: en desarrollo el
   * proxy de Vite y en Vercel un rewrite la reenvían al backend, así el
   * navegador sólo ve un origen (sin CORS y con cookies de sesión).
   */
  VITE_API_BASE_URL: z
    .string()
    .catch('')
    .transform((url) => (url || '/api').replace(/\/+$/, '')),
  /** `sesion` (cookie de Django + CSRF) o `jwt` (simplejwt). */
  VITE_API_AUTH: z.enum(['sesion', 'jwt']).catch('sesion'),
});

export interface Entorno {
  fuenteDatos: 'local' | 'http';
  apiBaseUrl: string;
  apiAuth: 'sesion' | 'jwt';
}

/**
 * Configuración vigente. Se lee en cada llamada (es barato) para que las
 * pruebas puedan cambiar variables con `vi.stubEnv`.
 */
export function entorno(): Entorno {
  const variables = import.meta.env as Record<string, unknown>;
  const leido = esquema.parse({
    VITE_DATA_SOURCE: variables.VITE_DATA_SOURCE ?? undefined,
    VITE_API_BASE_URL: variables.VITE_API_BASE_URL ?? '',
    VITE_API_AUTH: variables.VITE_API_AUTH ?? undefined,
  });
  return {
    fuenteDatos: leido.VITE_DATA_SOURCE,
    apiBaseUrl: leido.VITE_API_BASE_URL,
    apiAuth: leido.VITE_API_AUTH,
  };
}
