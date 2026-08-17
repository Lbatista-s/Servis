/** Ruta de migas de pan. El último elemento es la página actual. */

import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import { Icono } from './Icons';

export interface Miga {
  etiqueta: string;
  /** Ruta de destino. El elemento sin `a` se considera la página actual. */
  a?: string;
}

export function Breadcrumb({ migas, className }: { migas: readonly Miga[]; className?: string }) {
  return (
    <nav aria-label="Ruta de navegación" className={cn('mb-5', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-base text-ink-3">
        {migas.map((miga, indice) => {
          const esUltima = indice === migas.length - 1;
          return (
            <li key={`${miga.etiqueta}-${indice}`} className="flex items-center gap-1.5">
              {miga.a && !esUltima ? (
                <Link to={miga.a} className="rounded-xs transition-colors hover:text-primary">
                  {miga.etiqueta}
                </Link>
              ) : (
                <span className={cn(esUltima && 'font-medium text-ink')} aria-current={esUltima ? 'page' : undefined}>
                  {miga.etiqueta}
                </span>
              )}
              {esUltima ? null : <Icono nombre="chevron" className="h-3 w-3" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
