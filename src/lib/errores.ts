/** Mensajes de error presentables en español. */

import { ErrorRepositorio } from '@/data/repositories/types';

/** Traduce cualquier excepción a un mensaje presentable. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorRepositorio) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado.';
}
