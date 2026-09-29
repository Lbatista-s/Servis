/**
 * Avisos temporales sobre `notification` de Ant Design.
 *
 * `useToast()` conserva la API de siempre (`exito`, `error`, `mostrar`) para
 * que las pantallas no dependan de la librería. Requiere `<ProveedorUI>`.
 */

import { App } from 'antd';
import { useMemo } from 'react';

export type TonoAviso = 'exito' | 'error' | 'aviso' | 'info';

interface Aviso {
  titulo: string;
  descripcion?: string;
  tono: TonoAviso;
}

interface ContextoAvisos {
  mostrar: (aviso: Aviso) => void;
  exito: (titulo: string, descripcion?: string) => void;
  error: (titulo: string, descripcion?: string) => void;
}

const TIPO = {
  exito: 'success',
  error: 'error',
  aviso: 'warning',
  info: 'info',
} as const satisfies Record<TonoAviso, string>;

/** Acceso al sistema de avisos. Falla de forma explícita si falta el proveedor. */
export function useToast(): ContextoAvisos {
  const { notification } = App.useApp();

  const avisos = useMemo<ContextoAvisos>(() => {
    const mostrar = ({ titulo, descripcion, tono }: Aviso) =>
      notification[TIPO[tono]]({
        title: titulo,
        description: descripcion,
        placement: 'bottomRight',
        duration: 5,
      });
    return {
      mostrar,
      exito: (titulo, descripcion) => mostrar({ titulo, descripcion, tono: 'exito' }),
      error: (titulo, descripcion) => mostrar({ titulo, descripcion, tono: 'error' }),
    };
  }, [notification]);

  // Fuera de <App> de Ant Design el contexto llega vacío.
  if (!notification) {
    throw new Error('useToast debe usarse dentro de <ProveedorUI>.');
  }
  return avisos;
}
