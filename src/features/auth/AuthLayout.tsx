/** Armazón de dos columnas de las pantallas públicas (acceso y recuperación). */

import type { ReactNode } from 'react';

import { Logotipo, SelectorTema } from '@/components/ui';

export function AuthLayout({
  titular,
  descripcion,
  children,
}: {
  titular: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas lg:flex-row">
      {/* Columna izquierda: identidad institucional sobre el marco gris */}
      <div className="flex w-full shrink-0 flex-col bg-chrome px-8 py-10 lg:w-[420px] lg:px-10 lg:py-12">
        <Logotipo version="negativo" alto={72} className="mb-10 max-w-full" />

        <p className="text-3xl font-bold leading-snug text-white lg:text-[24px]">{titular}</p>
        <p className="mt-3 text-md leading-relaxed text-white/90">{descripcion}</p>

        <p className="mt-8 border-t border-white/10 pt-4 text-xs text-white/70 lg:mt-auto">
          Instituto Tecnológico de Santo Domingo · Área de Ingenierías
        </p>
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
