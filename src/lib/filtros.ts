/** Convenciones compartidas por los filtros de las pantallas de listado. */

/** Valor del filtro que no restringe nada («Todos los estados», «Todas las categorías»…). */
export const TODOS = 'todos';

export type ConTodos<T extends string> = T | typeof TODOS;

export interface OpcionFiltro<T extends string> {
  value: ConTodos<T>;
  label: string;
}

/** Opciones de un selector de filtro, precedidas de la opción que no filtra. */
export function opcionesConTodos<T extends string>(
  etiquetaTodos: string,
  etiquetas: Readonly<Record<T, string>> | ReadonlyMap<T, string>,
): OpcionFiltro<T>[] {
  const pares: [T, string][] =
    etiquetas instanceof Map
      ? [...etiquetas.entries()]
      : (Object.entries(etiquetas) as [T, string][]);
  return [
    { value: TODOS, label: etiquetaTodos },
    ...pares.map(([value, label]) => ({ value, label })),
  ];
}
