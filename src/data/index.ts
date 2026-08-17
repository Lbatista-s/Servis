/**
 * Punto único de acceso a la persistencia.
 *
 * La aplicación importa siempre desde aquí y nunca desde una implementación
 * concreta. Cambiar de localStorage a una API real es cambiar una variable de
 * entorno; ningún componente se entera.
 */

import { crearRepositoriosHttp } from './repositories/http';
import { crearRepositoriosLocales } from './repositories/localStorage';
import type { Repositorios } from './repositories/types';

export type FuenteDatos = 'local' | 'http';

/** Fuente activa, leída de `VITE_DATA_SOURCE` (por defecto, `local`). */
export function fuenteActiva(): FuenteDatos {
  return import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'local';
}

function crearRepositorios(fuente: FuenteDatos): Repositorios {
  return fuente === 'http' ? crearRepositoriosHttp() : crearRepositoriosLocales();
}

/**
 * Instancia compartida. Se crea una sola vez porque los repositorios no
 * mantienen estado propio: la verdad vive en el almacén.
 */
export const repositorios: Repositorios = crearRepositorios(fuenteActiva());

/** Fábrica explícita, útil en pruebas para forzar una implementación concreta. */
export { crearRepositorios };

export * from './repositories/types';
export { SERVIS_SCHEMA_VERSION } from './schema';
