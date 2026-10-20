/**
 * Configuración de la conexión con la API, leída de las variables de entorno.
 *
 * Las variables `VITE_*` se fijan al compilar: cambiarlas en Vercel exige
 * volver a desplegar.
 */

export type ModoAutenticacion = 'sesion' | 'jwt';

/**
 * Raíz de la API, sin barra final. Por defecto `/api`: en desarrollo el proxy
 * de Vite y en Vercel un rewrite la reenvían al backend, de modo que el
 * navegador sólo ve un origen (sin CORS y con cookies de sesión).
 */
export function urlBase(): string {
  return (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

/**
 * Cómo se autentica la API de Django:
 * - `sesion`: cookie de sesión + token CSRF (autenticación estándar de Django).
 * - `jwt`: `Authorization: Bearer` con `djangorestframework-simplejwt`.
 */
export function modoAutenticacion(): ModoAutenticacion {
  return import.meta.env.VITE_API_AUTH === 'jwt' ? 'jwt' : 'sesion';
}
