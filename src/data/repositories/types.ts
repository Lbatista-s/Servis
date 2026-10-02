/**
 * Contratos de la capa de persistencia.
 *
 * Todos los métodos son asíncronos aunque la implementación actual resuelva de
 * inmediato desde localStorage. Cuando el sistema pase a un backend real bastará
 * con proporcionar otra implementación de estas mismas interfaces: ni la
 * interfaz de usuario ni el estado global cambian.
 */

import type { OpcionesTransicion } from '@/domain/businessRules';
import type { Metas } from '@/domain/indicadores/definiciones';
import type {
  Actor,
  Adjunto,
  EstadoSolicitud,
  Rol,
  Servicio,
  Solicitud,
  Usuario,
} from '@/domain/types';

// ─────────────────────────────────────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────────────────────────────────────

export type CodigoErrorRepositorio =
  | 'NO_ENCONTRADO'
  | 'REGLA_DE_NEGOCIO'
  | 'CONFLICTO'
  | 'NO_IMPLEMENTADO'
  /** Sin sesión o sesión caducada (HTTP 401). */
  | 'NO_AUTENTICADO'
  /** La sesión no tiene permiso para la operación (HTTP 403). */
  | 'PROHIBIDO'
  /** El servidor no respondió o falló (sin conexión, HTTP 5xx). */
  | 'ERROR_RED';

/**
 * Error uniforme de la capa de datos. La implementación HTTP traducirá los
 * códigos de estado del servidor a estos mismos códigos, de modo que la interfaz
 * no necesite distinguir el origen.
 */
export class ErrorRepositorio extends Error {
  readonly codigo: CodigoErrorRepositorio;

  constructor(codigo: CodigoErrorRepositorio, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorRepositorio';
    this.codigo = codigo;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

export interface FiltroSolicitudes {
  /** Limita el resultado a las solicitudes de un estudiante concreto. */
  solicitanteId?: string;
  estados?: readonly EstadoSolicitud[];
  servicioId?: string;
  /** Búsqueda libre por identificador de solicitud. */
  busqueda?: string;
}

export interface DatosNuevaSolicitud {
  servicioId: string;
  solicitanteId: string;
  datosFormulario: Record<string, string>;
  adjuntos?: Adjunto[];
}

export interface CambiosSolicitud {
  datosFormulario?: Record<string, string>;
  adjuntos?: Adjunto[];
  comentarioInterno?: string;
  asignadaA?: string | null;
}

export interface IRequestRepository {
  listar(filtro?: FiltroSolicitudes): Promise<Solicitud[]>;
  obtener(id: string): Promise<Solicitud | null>;
  /** Crea la solicitud en estado `borrador` con su primera entrada de historial. */
  crear(datos: DatosNuevaSolicitud, actor: Actor): Promise<Solicitud>;
  /** Guarda cambios de contenido; falla si la solicitud ya es inmutable. */
  guardar(id: string, cambios: CambiosSolicitud, actor: Actor): Promise<Solicitud>;
  /** Ejecuta un cambio de estado validado contra la máquina de estados. */
  transicionar(
    id: string,
    hacia: EstadoSolicitud,
    actor: Actor,
    opciones?: OpcionesTransicion,
  ): Promise<Solicitud>;
  eliminar(id: string): Promise<void>;
  /** Contenido de un archivo adjunto. */
  descargarAdjunto(solicitudId: string, adjuntoId: string): Promise<Blob>;
  /** PDF del documento de salida; falla si la solicitud no está completada. */
  descargarDocumento(id: string): Promise<Blob>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export interface FiltroUsuarios {
  rol?: Rol;
  activo?: boolean;
  busqueda?: string;
}

export type DatosNuevoUsuario = Omit<Usuario, 'id' | 'ultimoAcceso'>;

export interface IUserRepository {
  listar(filtro?: FiltroUsuarios): Promise<Usuario[]>;
  obtener(id: string): Promise<Usuario | null>;
  obtenerPorCorreo(correo: string): Promise<Usuario | null>;
  crear(datos: DatosNuevoUsuario): Promise<Usuario>;
  actualizar(id: string, cambios: Partial<DatosNuevoUsuario>): Promise<Usuario>;
  cambiarActivacion(id: string, activo: boolean): Promise<Usuario>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────────────────────

export interface FiltroServicios {
  soloActivos?: boolean;
  categoria?: Servicio['categoria'];
  busqueda?: string;
}

export type DatosNuevoServicio = Omit<Servicio, 'id'>;

export interface IServiceRepository {
  listar(filtro?: FiltroServicios): Promise<Servicio[]>;
  obtener(id: string): Promise<Servicio | null>;
  crear(datos: DatosNuevoServicio): Promise<Servicio>;
  actualizar(id: string, cambios: Partial<DatosNuevoServicio>): Promise<Servicio>;
  /** Aplica la regla: no se puede activar un servicio sin requisitos. */
  cambiarActivacion(id: string, activo: boolean): Promise<Servicio>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metas del cuadro de mando
// ─────────────────────────────────────────────────────────────────────────────

export interface IMetasRepository {
  obtener(): Promise<Metas>;
  /** Sólo el coordinador fija las metas; el resto recibe `PROHIBIDO`. */
  guardar(metas: Metas, actor: Actor): Promise<Metas>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Autenticación
// ─────────────────────────────────────────────────────────────────────────────

export interface IAuthRepository {
  /**
   * Abre una sesión y devuelve el usuario. Falla con `NO_AUTENTICADO` si las
   * credenciales no son válidas o la cuenta está desactivada.
   */
  iniciarSesion(correo: string, contrasena: string): Promise<Usuario>;
  cerrarSesion(): Promise<void>;
  /** Usuario de la sesión vigente, o `null` si no hay sesión. */
  usuarioActual(): Promise<Usuario | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Agrupación
// ─────────────────────────────────────────────────────────────────────────────

export interface Repositorios {
  auth: IAuthRepository;
  solicitudes: IRequestRepository;
  usuarios: IUserRepository;
  servicios: IServiceRepository;
  metas: IMetasRepository;
  /** Restablece el almacenamiento a los datos de demostración iniciales. */
  restablecerDemo(): Promise<void>;
}
