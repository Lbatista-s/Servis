/**
 * Repositorios HTTP — stubs preparados para la fase final.
 *
 * Cada clase implementa la misma interfaz que su equivalente en
 * `localStorage/`, de modo que activarlos no exige tocar ni un componente:
 * basta con completar los cuerpos y poner `VITE_DATA_SOURCE=http`.
 *
 * Las rutas comentadas junto a cada método son el contrato sugerido para la API.
 */

import type { OpcionesTransicion } from '@/domain/businessRules';
import type { Actor, EstadoSolicitud, Servicio, Solicitud, Usuario } from '@/domain/types';
import type {
  CambiosSolicitud,
  DatosNuevaSolicitud,
  DatosNuevoServicio,
  DatosNuevoUsuario,
  FiltroServicios,
  FiltroSolicitudes,
  FiltroUsuarios,
  IRequestRepository,
  IServiceRepository,
  IUserRepository,
  Repositorios,
} from '@/data/repositories/types';

import { noImplementado } from './cliente';

export class RepositorioSolicitudesHttp implements IRequestRepository {
  /** GET /solicitudes */
  listar(_filtro?: FiltroSolicitudes): Promise<Solicitud[]> {
    return noImplementado('solicitudes.listar');
  }

  /** GET /solicitudes/:id */
  obtener(_id: string): Promise<Solicitud | null> {
    return noImplementado('solicitudes.obtener');
  }

  /** POST /solicitudes */
  crear(_datos: DatosNuevaSolicitud, _actor: Actor): Promise<Solicitud> {
    return noImplementado('solicitudes.crear');
  }

  /** PATCH /solicitudes/:id */
  guardar(_id: string, _cambios: CambiosSolicitud, _actor: Actor): Promise<Solicitud> {
    return noImplementado('solicitudes.guardar');
  }

  /** POST /solicitudes/:id/transiciones */
  transicionar(
    _id: string,
    _hacia: EstadoSolicitud,
    _actor: Actor,
    _opciones?: OpcionesTransicion,
  ): Promise<Solicitud> {
    return noImplementado('solicitudes.transicionar');
  }

  /** DELETE /solicitudes/:id */
  eliminar(_id: string): Promise<void> {
    return noImplementado('solicitudes.eliminar');
  }
}

export class RepositorioUsuariosHttp implements IUserRepository {
  /** GET /usuarios */
  listar(_filtro?: FiltroUsuarios): Promise<Usuario[]> {
    return noImplementado('usuarios.listar');
  }

  /** GET /usuarios/:id */
  obtener(_id: string): Promise<Usuario | null> {
    return noImplementado('usuarios.obtener');
  }

  /** GET /usuarios?correo= */
  obtenerPorCorreo(_correo: string): Promise<Usuario | null> {
    return noImplementado('usuarios.obtenerPorCorreo');
  }

  /** POST /usuarios */
  crear(_datos: DatosNuevoUsuario): Promise<Usuario> {
    return noImplementado('usuarios.crear');
  }

  /** PATCH /usuarios/:id */
  actualizar(_id: string, _cambios: Partial<DatosNuevoUsuario>): Promise<Usuario> {
    return noImplementado('usuarios.actualizar');
  }

  /** PATCH /usuarios/:id/activacion */
  cambiarActivacion(_id: string, _activo: boolean): Promise<Usuario> {
    return noImplementado('usuarios.cambiarActivacion');
  }
}

export class RepositorioServiciosHttp implements IServiceRepository {
  /** GET /servicios */
  listar(_filtro?: FiltroServicios): Promise<Servicio[]> {
    return noImplementado('servicios.listar');
  }

  /** GET /servicios/:id */
  obtener(_id: string): Promise<Servicio | null> {
    return noImplementado('servicios.obtener');
  }

  /** POST /servicios */
  crear(_datos: DatosNuevoServicio): Promise<Servicio> {
    return noImplementado('servicios.crear');
  }

  /** PATCH /servicios/:id */
  actualizar(_id: string, _cambios: Partial<DatosNuevoServicio>): Promise<Servicio> {
    return noImplementado('servicios.actualizar');
  }

  /** PATCH /servicios/:id/activacion */
  cambiarActivacion(_id: string, _activo: boolean): Promise<Servicio> {
    return noImplementado('servicios.cambiarActivacion');
  }
}

export function crearRepositoriosHttp(): Repositorios {
  return {
    solicitudes: new RepositorioSolicitudesHttp(),
    usuarios: new RepositorioUsuariosHttp(),
    servicios: new RepositorioServiciosHttp(),
    /** POST /demo/restablecer */
    restablecerDemo: () => noImplementado('restablecerDemo'),
  };
}
