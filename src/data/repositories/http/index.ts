/**
 * Repositorios sobre la API REST de Django.
 *
 * Implementan las mismas interfaces que los de `localStorage/`, así que
 * activarlos (`VITE_DATA_SOURCE=http`) no exige tocar ninguna pantalla. Las
 * rutas viven en `./rutas.ts` y la forma del JSON en `./mapeadores.ts`; el
 * contrato completo está en `docs/api.md`.
 *
 * Las reglas de negocio se validan en el servidor. La interfaz sigue
 * consultando el dominio antes de actuar (para no ofrecer acciones inválidas),
 * pero la decisión final es del backend.
 */

import { archivoRegistrado, olvidarArchivo } from '@/data/archivos';
import type { OpcionesTransicion } from '@/domain/businessRules';
import { METAS_POR_DEFECTO, type Metas } from '@/domain/indicadores/definiciones';
import type { Actor, Adjunto, EstadoSolicitud, Servicio, Solicitud, Usuario } from '@/domain/types';
import { ErrorRepositorio } from '@/data/repositories/types';
import type {
  CambiosSolicitud,
  DatosNuevaSolicitud,
  DatosNuevoServicio,
  DatosNuevoUsuario,
  FiltroServicios,
  FiltroSolicitudes,
  FiltroUsuarios,
  IAuthRepository,
  IMetasRepository,
  IRequestRepository,
  IServiceRepository,
  IUserRepository,
  Repositorios,
} from '@/data/repositories/types';

import { detalleOpcional, lista, noImplementado, peticion } from './cliente';
import { modoAutenticacion } from './config';
import {
  aServicio,
  aSolicitud,
  aUsuario,
  desdeCredenciales,
  sinClaves,
  type Dto,
} from './mapeadores';
import { API, consultaServicios, consultaSolicitudes, consultaUsuarios } from './rutas';
import { guardarTokens, leerCookie, type TokensJwt } from './sesion';

// ─────────────────────────────────────────────────────────────────────────────
// Autenticación
// ─────────────────────────────────────────────────────────────────────────────

export class RepositorioAuthHttp implements IAuthRepository {
  async iniciarSesion(correo: string, contrasena: string): Promise<Usuario> {
    const credenciales = desdeCredenciales(correo, contrasena);

    if (modoAutenticacion() === 'jwt') {
      const tokens = await peticion<TokensJwt>(API.auth.token, {
        metodo: 'POST',
        cuerpo: credenciales,
        sesionRequerida: false,
      });
      guardarTokens(tokens);
      return aUsuario(await peticion<Dto>(API.auth.yo));
    }

    // Django sólo acepta el POST si antes fijó la cookie `csrftoken`.
    if (!leerCookie('csrftoken')) {
      await peticion(API.auth.csrf, { respuesta: 'nada', sesionRequerida: false });
    }
    const usuario = await peticion<Dto>(API.auth.login, {
      metodo: 'POST',
      cuerpo: credenciales,
      sesionRequerida: false,
    });
    return aUsuario(usuario);
  }

  async cerrarSesion(): Promise<void> {
    if (modoAutenticacion() === 'jwt') {
      guardarTokens(null);
      return;
    }
    try {
      await peticion(API.auth.logout, {
        metodo: 'POST',
        respuesta: 'nada',
        sesionRequerida: false,
      });
    } catch {
      // Si el servidor ya no reconoce la sesión, el resultado es el mismo.
    }
  }

  async usuarioActual(): Promise<Usuario | null> {
    try {
      return aUsuario(await peticion<Dto>(API.auth.yo, { sesionRequerida: false }));
    } catch (error) {
      if (
        error instanceof ErrorRepositorio &&
        (error.codigo === 'NO_AUTENTICADO' || error.codigo === 'PROHIBIDO')
      ) {
        return null;
      }
      throw error;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

export class RepositorioSolicitudesHttp implements IRequestRepository {
  async listar(filtro?: FiltroSolicitudes): Promise<Solicitud[]> {
    const dtos = await lista<Dto>(API.solicitudes.lista, consultaSolicitudes(filtro));
    return dtos.map(aSolicitud);
  }

  async obtener(id: string): Promise<Solicitud | null> {
    const dto = await detalleOpcional<Dto>(API.solicitudes.detalle(id));
    return dto ? aSolicitud(dto) : null;
  }

  /** El solicitante lo fija el servidor a partir de la sesión. */
  async crear(datos: DatosNuevaSolicitud, _actor: Actor): Promise<Solicitud> {
    const creada = aSolicitud(
      await peticion<Dto>(API.solicitudes.lista, {
        metodo: 'POST',
        cuerpo: { servicioId: datos.servicioId, datosFormulario: datos.datosFormulario },
      }),
    );
    if (!datos.adjuntos?.length) return creada;

    await this.sincronizarAdjuntos(creada, datos.adjuntos);
    return (await this.obtener(creada.id)) ?? creada;
  }

  async guardar(id: string, cambios: CambiosSolicitud, _actor: Actor): Promise<Solicitud> {
    const { adjuntos, ...resto } = cambios;

    if (adjuntos !== undefined) {
      const actual = await this.obtener(id);
      if (!actual) throw new ErrorRepositorio('NO_ENCONTRADO', `No existe la solicitud ${id}.`);
      await this.sincronizarAdjuntos(actual, adjuntos);
    }

    if (Object.keys(resto).length > 0) {
      return aSolicitud(
        await peticion<Dto>(API.solicitudes.detalle(id), { metodo: 'PATCH', cuerpo: resto }),
      );
    }
    const guardada = await this.obtener(id);
    if (!guardada) throw new ErrorRepositorio('NO_ENCONTRADO', `No existe la solicitud ${id}.`);
    return guardada;
  }

  async transicionar(
    id: string,
    hacia: EstadoSolicitud,
    _actor: Actor,
    opciones: OpcionesTransicion = {},
  ): Promise<Solicitud> {
    return aSolicitud(
      await peticion<Dto>(API.solicitudes.transiciones(id), {
        metodo: 'POST',
        cuerpo: { hacia, comentario: opciones.comentario?.trim() || null },
      }),
    );
  }

  async eliminar(id: string): Promise<void> {
    await peticion(API.solicitudes.detalle(id), { metodo: 'DELETE', respuesta: 'nada' });
  }

  descargarAdjunto(solicitudId: string, adjuntoId: string): Promise<Blob> {
    return peticion<Blob>(API.solicitudes.archivoAdjunto(solicitudId, adjuntoId), {
      respuesta: 'blob',
    });
  }

  descargarDocumento(id: string): Promise<Blob> {
    return peticion<Blob>(API.solicitudes.documento(id), { respuesta: 'blob' });
  }

  /**
   * Lleva los adjuntos del servidor a la lista deseada: borra los que ya no
   * están y sube los nuevos (los que tienen un archivo registrado pendiente).
   */
  private async sincronizarAdjuntos(
    actual: Solicitud,
    deseados: readonly Adjunto[],
  ): Promise<void> {
    const conservar = new Set(deseados.map((a) => a.id));
    for (const adjunto of actual.adjuntos) {
      if (!conservar.has(adjunto.id)) {
        await peticion(API.solicitudes.adjunto(actual.id, adjunto.id), {
          metodo: 'DELETE',
          respuesta: 'nada',
        });
      }
    }

    for (const adjunto of deseados) {
      const archivo = archivoRegistrado(adjunto.id);
      if (!archivo) continue;
      const formulario = new FormData();
      formulario.append('archivo', archivo, adjunto.nombre);
      await peticion(API.solicitudes.adjuntos(actual.id), { metodo: 'POST', cuerpo: formulario });
      olvidarArchivo(adjunto.id);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export class RepositorioUsuariosHttp implements IUserRepository {
  async listar(filtro?: FiltroUsuarios): Promise<Usuario[]> {
    return (await lista<Dto>(API.usuarios.lista, consultaUsuarios(filtro))).map(aUsuario);
  }

  async obtener(id: string): Promise<Usuario | null> {
    const dto = await detalleOpcional<Dto>(API.usuarios.detalle(id));
    return dto ? aUsuario(dto) : null;
  }

  async obtenerPorCorreo(correo: string): Promise<Usuario | null> {
    const dtos = await lista<Dto>(API.usuarios.lista, { correo: correo.trim() });
    const usuario = dtos[0];
    return usuario ? aUsuario(usuario) : null;
  }

  async crear(datos: DatosNuevoUsuario): Promise<Usuario> {
    return aUsuario(
      await peticion<Dto>(API.usuarios.lista, {
        metodo: 'POST',
        cuerpo: sinClaves(datos, ['iniciales', 'colorAvatar']),
      }),
    );
  }

  async actualizar(id: string, cambios: Partial<DatosNuevoUsuario>): Promise<Usuario> {
    return aUsuario(
      await peticion<Dto>(API.usuarios.detalle(id), { metodo: 'PATCH', cuerpo: cambios }),
    );
  }

  cambiarActivacion(id: string, activo: boolean): Promise<Usuario> {
    return this.actualizar(id, { activo });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────────────────────

export class RepositorioServiciosHttp implements IServiceRepository {
  async listar(filtro?: FiltroServicios): Promise<Servicio[]> {
    return (await lista<Dto>(API.servicios.lista, consultaServicios(filtro))).map(aServicio);
  }

  async obtener(id: string): Promise<Servicio | null> {
    const dto = await detalleOpcional<Dto>(API.servicios.detalle(id));
    return dto ? aServicio(dto) : null;
  }

  async crear(datos: DatosNuevoServicio): Promise<Servicio> {
    return aServicio(await peticion<Dto>(API.servicios.lista, { metodo: 'POST', cuerpo: datos }));
  }

  async actualizar(id: string, cambios: Partial<DatosNuevoServicio>): Promise<Servicio> {
    return aServicio(
      await peticion<Dto>(API.servicios.detalle(id), { metodo: 'PATCH', cuerpo: cambios }),
    );
  }

  /** El servidor aplica la regla de no activar un servicio sin requisitos. */
  cambiarActivacion(id: string, activo: boolean): Promise<Servicio> {
    return this.actualizar(id, { activo });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metas del cuadro de mando
// ─────────────────────────────────────────────────────────────────────────────

export class RepositorioMetasHttp implements IMetasRepository {
  /** Las metas que el servidor aún no define toman su valor por defecto. */
  async obtener(): Promise<Metas> {
    return { ...METAS_POR_DEFECTO, ...(await peticion<Partial<Metas>>(API.indicadores.metas)) };
  }

  /** El servidor comprueba que quien guarda sea coordinador. */
  async guardar(metas: Metas, _actor: Actor): Promise<Metas> {
    const guardadas = await peticion<Partial<Metas>>(API.indicadores.metas, {
      metodo: 'PUT',
      cuerpo: metas,
    });
    return { ...METAS_POR_DEFECTO, ...guardadas };
  }
}

export function crearRepositoriosHttp(): Repositorios {
  return {
    auth: new RepositorioAuthHttp(),
    solicitudes: new RepositorioSolicitudesHttp(),
    usuarios: new RepositorioUsuariosHttp(),
    servicios: new RepositorioServiciosHttp(),
    metas: new RepositorioMetasHttp(),
    restablecerDemo: () => Promise.resolve().then(() => noImplementado('restablecerDemo')),
  };
}
