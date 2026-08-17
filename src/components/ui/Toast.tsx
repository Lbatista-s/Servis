/**
 * Sistema de avisos temporales sobre Radix Toast.
 *
 * `ToastProvider` se monta una sola vez en la raíz y `useToast()` permite a
 * cualquier componente lanzar un aviso sin prop drilling.
 */

import * as ToastPrimitive from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Icono, type NombreIcono } from './Icons';

export type TonoAviso = 'exito' | 'error' | 'aviso' | 'info';

interface Aviso {
  id: number;
  titulo: string;
  descripcion?: string;
  tono: TonoAviso;
}

interface ContextoAvisos {
  mostrar: (aviso: Omit<Aviso, 'id'>) => void;
  exito: (titulo: string, descripcion?: string) => void;
  error: (titulo: string, descripcion?: string) => void;
}

const AvisosContexto = createContext<ContextoAvisos | null>(null);

/** Acceso al sistema de avisos. Falla de forma explícita si falta el proveedor. */
export function useToast(): ContextoAvisos {
  const contexto = useContext(AvisosContexto);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  }
  return contexto;
}

const ESTILO: Record<TonoAviso, { borde: string; icono: NombreIcono; color: string }> = {
  exito: { borde: 'border-l-success', icono: 'verificar', color: 'text-success' },
  error: { borde: 'border-l-danger', icono: 'cerrar', color: 'text-danger' },
  aviso: { borde: 'border-l-warning', icono: 'campana', color: 'text-warning' },
  info: { borde: 'border-l-info', icono: 'campana', color: 'text-info' },
};

let siguienteId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const mostrar = useCallback((aviso: Omit<Aviso, 'id'>) => {
    siguienteId += 1;
    const id = siguienteId;
    setAvisos((actuales) => [...actuales, { ...aviso, id }]);
  }, []);

  const cerrar = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((a) => a.id !== id));
  }, []);

  const valor = useMemo<ContextoAvisos>(
    () => ({
      mostrar,
      exito: (titulo, descripcion) => mostrar({ titulo, descripcion, tono: 'exito' }),
      error: (titulo, descripcion) => mostrar({ titulo, descripcion, tono: 'error' }),
    }),
    [mostrar],
  );

  return (
    <AvisosContexto.Provider value={valor}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}

        {avisos.map((aviso) => {
          const estilo = ESTILO[aviso.tono];
          return (
            <ToastPrimitive.Root
              key={aviso.id}
              onOpenChange={(abierto) => {
                if (!abierto) cerrar(aviso.id);
              }}
              className={cn(
                'flex items-start gap-3 rounded-md border border-line border-l-[3px] bg-surface',
                'px-4 py-3 shadow-s4 data-[state=open]:animate-toast-in',
                estilo.borde,
              )}
            >
              <Icono nombre={estilo.icono} className={cn('mt-0.5 h-4 w-4', estilo.color)} />
              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-base font-semibold text-ink">
                  {aviso.titulo}
                </ToastPrimitive.Title>
                {aviso.descripcion ? (
                  <ToastPrimitive.Description className="mt-1 text-sm text-ink-3">
                    {aviso.descripcion}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Cerrar aviso"
                className="text-ink-4 hover:text-ink-2"
              >
                <Icono nombre="cerrar" className="h-3.5 w-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}

        <ToastPrimitive.Viewport
          className={cn(
            'fixed bottom-0 right-0 z-[100] flex w-full max-w-96 flex-col gap-2 p-4 outline-none',
          )}
        />
      </ToastPrimitive.Provider>
    </AvisosContexto.Provider>
  );
}
