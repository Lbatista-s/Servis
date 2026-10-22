/**
 * Configuración de la conexión con la API, leída de las variables de entorno.
 *
 * Las variables `VITE_*` se fijan al compilar: cambiarlas en Vercel exige
 * volver a desplegar.
 */

import { entorno } from '@/config/entorno';

export type ModoAutenticacion = 'sesion' | 'jwt';

/** Raíz de la API, sin barra final (ver `src/config/entorno.ts`). */
export function urlBase(): string {
  return entorno().apiBaseUrl;
}

/**
 * Cómo se autentica la API de Django:
 * - `sesion`: cookie de sesión + token CSRF (autenticación estándar de Django).
 * - `jwt`: `Authorization: Bearer` con `djangorestframework-simplejwt`.
 */
export function modoAutenticacion(): ModoAutenticacion {
  return entorno().apiAuth;
}
