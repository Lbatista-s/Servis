/** Armazón de dos columnas de las pantallas públicas (acceso y recuperación). */

import type { ReactNode } from 'react';

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
  /** Fragmento del titular que se pinta en rojo institucional. */
  destacado: string;
  descripcion: string;
  estadisticas: readonly EstadisticaAcceso[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      {/* Columna izquierda: identidad institucional */}
      <div className="relative flex w-full shrink-0 flex-col overflow-hidden bg-shell px-8 py-10 lg:w-[420px] lg:px-10 lg:py-12">
        {/* Halos decorativos del prototipo */}
        <span
          aria-hidden="true"
          className="absolute -right-20 -top-20 h-70 w-70 rounded-full bg-primary/[0.12]"
          style={{ height: 280, width: 280 }}
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-16 -left-10 rounded-full bg-primary/[0.08]"
          style={{ height: 200, width: 200 }}
        />

        <img
          src="/servis-banner.png"
          alt="SERVIS — Servicios académicos y administrativos automatizados, INTEC"
          className="relative z-10 mb-8 w-full max-w-[280px]"
          width={876}
          height={296}
        />

        <p className="relative z-10 text-3xl font-bold leading-snug text-white lg:text-[24px]">
          {titular} <span className="text-primary">{destacado}</span>
        </p>
        <p className="relative z-10 mt-3 text-md leading-relaxed text-white/50">{descripcion}</p>

        <dl className="relative z-10 mt-8 flex gap-6 lg:mt-auto lg:pt-10">
          {estadisticas.map((estadistica) => (
            <div key={estadistica.etiqueta}>
              <dt className="sr-only">{estadistica.etiqueta}</dt>
              <dd>
                <span className="block text-4xl font-bold text-white">{estadistica.valor}</span>
                <span className="mt-0.5 block text-xs text-white/40" aria-hidden="true">
                  {estadistica.etiqueta}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Columna derecha: formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-10 lg:p-12">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}
