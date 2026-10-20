/** Pares etiqueta–valor en columnas, sobre `Descriptions` de Ant Design. */

import { Descriptions } from 'antd';
import type { ReactNode } from 'react';

export interface Dato {
  etiqueta: string;
  valor: ReactNode;
  /** Ocupa toda la fila (textos largos). */
  anchoCompleto?: boolean;
}

/** Texto que se muestra cuando un dato está vacío. */
const VACIO = '—';

export function ListaDatos({ datos, vacio = VACIO }: { datos: readonly Dato[]; vacio?: string }) {
  return (
    <Descriptions
      layout="vertical"
      size="small"
      colon={false}
      column={{ xs: 1, sm: 2 }}
      items={datos.map(({ etiqueta, valor, anchoCompleto }) => ({
        key: etiqueta,
        span: anchoCompleto ? 'filled' : 1,
        label: <span className="text-xs font-semibold uppercase tracking-wide">{etiqueta}</span>,
        children: estaVacio(valor) ? <span className="text-ink-3">{vacio}</span> : valor,
      }))}
    />
  );
}

function estaVacio(valor: ReactNode): boolean {
  return valor == null || valor === false || (typeof valor === 'string' && valor.trim() === '');
}
