/**
 * Estado de la sesión HTTP que no pertenece al dominio: los tokens JWT y el
 * aviso de sesión caducada.
 *
 * Los tokens viven en `sessionStorage`: sobreviven a una recarga de la pestaña
 * pero no se comparten entre pestañas ni quedan en el equipo al cerrarla.
 */

export interface TokensJwt {
  access: string;
  refresh: string;
}

const CLAVE_TOKENS = 'servis:jwt';

export function leerTokens(): TokensJwt | null {
  try {
    const bruto = sessionStorage.getItem(CLAVE_TOKENS);
    return bruto ? (JSON.parse(bruto) as TokensJwt) : null;
  } catch {
    return null;
  }
}

export function guardarTokens(tokens: TokensJwt | null): void {
  try {
    if (tokens) sessionStorage.setItem(CLAVE_TOKENS, JSON.stringify(tokens));
    else sessionStorage.removeItem(CLAVE_TOKENS);
  } catch {
    // Almacenamiento no disponible: la sesión dura lo que dure la página.
  }
}

let alCaducar: (() => void) | null = null;

/**
 * Registra qué hacer cuando el servidor rechaza la sesión (401 sin posibilidad
 * de renovarla). Lo usa el store de autenticación para cerrar la sesión sin
 * que la capa de datos dependa de él.
 */
export function alCaducarSesion(accion: () => void): void {
  alCaducar = accion;
}

export function notificarSesionCaducada(): void {
  alCaducar?.();
}

/** Valor de una cookie del documento (p. ej. `csrftoken`). */
export function leerCookie(nombre: string): string | null {
  if (typeof document === 'undefined') return null;
  const par = document.cookie.split('; ').find((c) => c.startsWith(`${nombre}=`));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null;
}
