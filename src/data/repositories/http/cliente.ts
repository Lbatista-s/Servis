/**
 * Cliente HTTP mínimo para la fase final del proyecto.
 *
 * Está escrito pero deliberadamente sin uso: los repositorios HTTP son todavía
 * stubs. Cuando exista la API bastará con completar los métodos de
 * `http/*Repository.ts` apoyándose en estas funciones y cambiar
 * `VITE_DATA_SOURCE` a `http`.
 */

import { ErrorRepositorio, type CodigoErrorRepositorio } from '@/data/repositories/types';

export function urlBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
}

/** Traduce el código de estado HTTP al código de error uniforme del dominio. */
function codigoDesdeEstado(estado: number): CodigoErrorRepositorio {
  if (estado === 404) return 'NO_ENCONTRADO';
  if (estado === 409) return 'CONFLICTO';
  if (estado === 422 || estado === 400) return 'REGLA_DE_NEGOCIO';
  return 'REGLA_DE_NEGOCIO';
}

export async function peticion<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${urlBase()}${ruta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!respuesta.ok) {
    let mensaje = `La petición a ${ruta} falló con estado ${respuesta.status}.`;
    try {
      const cuerpo: unknown = await respuesta.json();
      if (
        typeof cuerpo === 'object' &&
        cuerpo !== null &&
        typeof (cuerpo as { mensaje?: unknown }).mensaje === 'string'
      ) {
        mensaje = (cuerpo as { mensaje: string }).mensaje;
      }
    } catch {
      // El cuerpo no era JSON; se conserva el mensaje genérico.
    }
    throw new ErrorRepositorio(codigoDesdeEstado(respuesta.status), mensaje);
  }

  return (await respuesta.json()) as T;
}

/** Error uniforme para los métodos aún no implementados. */
export function noImplementado(metodo: string): never {
  throw new ErrorRepositorio(
    'NO_IMPLEMENTADO',
    `El repositorio HTTP todavía no implementa «${metodo}». ` +
      'Esta capa se completará en la fase de integración con el backend.',
  );
}
