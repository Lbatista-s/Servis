/**
 * Hook genérico para consumir la capa de repositorios.
 *
 * Toda lectura de datos pasa por aquí, de modo que los estados de carga y error
 * se manejan igual en toda la aplicación. Como los repositorios ya son
 * asíncronos, este código no cambiará cuando exista un backend real.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorRepositorio } from '@/data';

export interface EstadoAsincrono<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  /** Vuelve a ejecutar la consulta. */
  recargar: () => void;
}

/** Traduce cualquier excepción a un mensaje presentable en español. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorRepositorio) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado.';
}

export function useAsync<T>(
  consulta: () => Promise<T>,
  dependencias: readonly unknown[],
): EstadoAsincrono<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // La consulta se guarda en una referencia para que cambiar su identidad entre
  // renders no dispare la petición: las dependencias explícitas mandan.
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);

    consultaRef
      .current()
      .then((resultado) => {
        // Descarta la respuesta si el efecto ya fue reemplazado por otro.
        if (!vigente) return;
        setDatos(resultado);
      })
      .catch((fallo: unknown) => {
        if (!vigente) return;
        setError(mensajeDeError(fallo));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return { datos, cargando, error, recargar };
}
