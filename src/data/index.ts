/**
 * Punto único de acceso a la persistencia.
 *
 * La aplicación importa siempre desde aquí y nunca desde una implementación
 * concreta. Los repositorios hablan con la API por HTTP; mientras no exista el
 * backend, la responde el servidor simulado de `src/mocks/` (ver
 * `VITE_API_MOCK`) sin que ningún componente se entere.
 */

import { crearRepositoriosHttp } from './repositories/http';
import type { Repositorios } from './repositories/types';

/**
 * Instancia compartida. Se crea una sola vez porque los repositorios no
 * mantienen estado propio: la verdad vive en el servidor.
 */
export const repositorios: Repositorios = crearRepositoriosHttp();

export * from './repositories/types';
export { alCaducarSesion } from './repositories/http/sesion';
