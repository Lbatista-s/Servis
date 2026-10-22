/** Ruta de migas de pan sobre `Breadcrumb` de Ant Design. El último elemento es la página actual. */

import { Breadcrumb as AntBreadcrumb } from 'antd';
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
    <AntBreadcrumb
      // Ant Design alinea los elementos por la línea base y el separador (un
      // SVG) quedaba más alto que el texto: se centran en el eje vertical.
      className={cn(
        'mb-5 [&_.ant-breadcrumb-separator]:flex [&_.ant-breadcrumb-separator]:items-center [&_ol]:items-center',
        className,
      )}
      separator={<Icono nombre="chevron" className="h-3 w-3" />}
      items={migas.map((miga, indice) => {
        const esUltima = indice === migas.length - 1;
        return {
          key: `${miga.etiqueta}-${indice}`,
          title:
            miga.a && !esUltima ? (
              <Link to={miga.a}>{miga.etiqueta}</Link>
            ) : (
              <span className="font-medium text-ink" aria-current={esUltima ? 'page' : undefined}>
                {miga.etiqueta}
              </span>
            ),
        };
      })}
    />
  );
}
