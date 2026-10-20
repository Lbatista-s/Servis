/** Controles de las barras de filtro de las pantallas de listado. */

import { Select } from 'antd';

import type { OpcionFiltro } from '@/lib/filtros';
import { cn } from '@/lib/utils';

import { Input } from './Field';
import { Icono } from './Icons';

/** Buscador con icono y botón para vaciarlo. */
export function CampoBusqueda({
  valor,
  onCambio,
  placeholder,
  etiqueta,
  className = 'w-full sm:w-64',
}: {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder: string;
  /** Nombre accesible del campo. */
  etiqueta: string;
  className?: string;
}) {
  return (
    // El ancho va en el contenedor: el `Input` con icono de Ant Design fija el suyo.
    <div className={className}>
      <Input
        type="search"
        allowClear
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        prefix={<Icono nombre="buscar" className="text-ink-3" />}
      />
    </div>
  );
}

/** Selector de filtro; suele recibir las opciones de `opcionesConTodos`. */
export function SelectorFiltro<T extends string>({
  valor,
  onCambio,
  opciones,
  etiqueta,
  className,
}: {
  valor: T;
  onCambio: (valor: T) => void;
  opciones: readonly OpcionFiltro<T>[] | readonly { value: T; label: string }[];
  /** Nombre accesible del selector. */
  etiqueta: string;
  className?: string;
}) {
  return (
    <Select<T>
      value={valor}
      onChange={onCambio}
      aria-label={etiqueta}
      className={cn('w-full sm:w-48', className)}
      options={opciones as { value: T; label: string }[]}
    />
  );
}
