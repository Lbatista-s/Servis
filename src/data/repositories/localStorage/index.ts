/** Conjunto de repositorios respaldados por `localStorage`. */

import type { Repositorios } from '@/data/repositories/types';

import { restablecerAlmacen } from './almacen';
import { RepositorioAuthLocal } from './authRepository';
import { RepositorioServiciosLocal } from './serviceRepository';
import { RepositorioSolicitudesLocal } from './requestRepository';
import { RepositorioUsuariosLocal } from './userRepository';

export {
  RepositorioAuthLocal,
  RepositorioServiciosLocal,
  RepositorioSolicitudesLocal,
  RepositorioUsuariosLocal,
};
export { almacenInicial, leerAlmacen, restablecerAlmacen } from './almacen';

export function crearRepositoriosLocales(): Repositorios {
  return {
    auth: new RepositorioAuthLocal(),
    solicitudes: new RepositorioSolicitudesLocal(),
    usuarios: new RepositorioUsuariosLocal(),
    servicios: new RepositorioServiciosLocal(),
    restablecerDemo: () => {
      restablecerAlmacen();
      return Promise.resolve();
    },
  };
}
