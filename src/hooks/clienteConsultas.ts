/**
 * Caché de datos del servidor (TanStack Query).
 *
 * Un único cliente para toda la aplicación. Los reintentos sólo tienen sentido
 * ante fallos de red: un 404, un 403 o una regla de negocio no van a cambiar
 * por repetir la petición.
 */

import { QueryClient } from '@tanstack/react-query';

import { ErrorRepositorio } from '@/data/repositories/types';

export function crearClienteConsultas(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (intentos, error) =>
          intentos < 2 && (!(error instanceof ErrorRepositorio) || error.codigo === 'ERROR_RED'),
      },
      mutations: { retry: false },
    },
  });
}

export const clienteConsultas = crearClienteConsultas();

/** Raíz de las claves de cada recurso: invalidar una refresca todo lo suyo. */
export const RECURSOS = [
  'solicitudes',
  'servicios',
  'documentos',
  'usuarios',
  'metas',
  'notificaciones',
] as const;
export type Recurso = (typeof RECURSOS)[number];
