/** Armazón de dos columnas de las pantallas públicas (acceso y recuperación). */

import type { ReactNode } from 'react';

import { Logotipo, SelectorTema } from '@/components/ui';
import { COLORES_MARCA } from '@/theme/tokens';

export interface EstadisticaAcceso {
  valor: string;
  etiqueta: string;
}

export function AuthLayout({
  titular,
  destacado,
  descripcion,
  estadisticas,
  children,
}: {
  titular: string;
  /** Fragmento del titular que se resalta en Rojo INTEC claro. */
  destacado: string;
  descripcion: string;
  estadisticas: readonly EstadisticaAcceso[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      {/* Columna izquierda: identidad institucional sobre el marco gris */}
      <div className="relative flex w-full shrink-0 flex-col overflow-hidden bg-chrome px-8 py-10 lg:w-[420px] lg:px-10 lg:py-12">
        {/* Halos decorativos en Vino INTEC */}
        <span
          aria-hidden="true"
          className="absolute -right-20 -top-20 rounded-full bg-chrome-activo/25"
          style={{ height: 280, width: 280 }}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-16 -left-10 rounded-full bg-chrome-activo/20"
          style={{ height: 200, width: 200 }}
        />

        <Logotipo version="negativo" alto={72} className="relative z-10 mb-8 max-w-full" />

        <p className="relative z-10 text-3xl font-bold leading-snug text-white lg:text-[24px]">
          {/* Rojo 30 %: el Rojo puro no se lee sobre el gris; como texto grande supera 3:1. */}
          {titular} <span style={{ color: COLORES_MARCA.rojo30 }}>{destacado}</span>
        </p>
        <p className="relative z-10 mt-3 text-md leading-relaxed text-white/90">{descripcion}</p>

        <dl className="relative z-10 mt-8 flex gap-6 lg:mt-auto lg:pt-10">
          {estadisticas.map((estadistica) => (
            <div key={estadistica.etiqueta}>
              <dt className="sr-only">{estadistica.etiqueta}</dt>
              <dd>
                <span className="block text-4xl font-bold text-white">{estadistica.valor}</span>
                <span className="mt-0.5 block text-xs text-white/90" aria-hidden="true">
                  {estadistica.etiqueta}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Columna derecha: formulario */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10 lg:p-12">
        <div className="absolute right-4 top-4 rounded-full bg-chrome">
          <SelectorTema />
        </div>
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
