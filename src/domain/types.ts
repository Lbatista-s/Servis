/**
 * Modelo de dominio de SERVIS.
 *
 * Este módulo es deliberadamente puro: no importa React, no toca el
 * almacenamiento y no conoce la capa de red. Todo lo que vive aquí puede
 * probarse sin renderizar nada.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES = [
  'estudiante',
  'personal_administrativo',
  'coordinador',
  'administrador',
] as const;

export type Rol = (typeof ROLES)[number];

/** Etiquetas en español formal para presentación en la interfaz. */
export const ETIQUETA_ROL: Record<Rol, string> = {
  estudiante: 'Estudiante',
  personal_administrativo: 'Personal administrativo',
  coordinador: 'Coordinador',
  administrador: 'Administrador del sistema',
};

// ─────────────────────────────────────────────────────────────────────────────
// Estados del ciclo de vida
// ─────────────────────────────────────────────────────────────────────────────

export const ESTADOS = [
  'borrador',
  'enviada',
  'en_revision',
  'devuelta',
  'corregida',
  'aprobada',
  'rechazada',
  'completada',
  'cancelada',
] as const;

export type EstadoSolicitud = (typeof ESTADOS)[number];

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_revision: 'En revisión',
  devuelta: 'Devuelta',
  corregida: 'Corregida',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

/** Estados terminales: no admiten ninguna transición de salida. */
export const ESTADOS_FINALES: readonly EstadoSolicitud[] = [
  'rechazada',
  'completada',
  'cancelada',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Entidades
// ─────────────────────────────────────────────────────────────────────────────

export type ColorAvatar = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  iniciales: string;
  colorAvatar: ColorAvatar;
  activo: boolean;
  /** Datos académicos: sólo presentes cuando el rol es `estudiante`. */
  matricula?: string;
  carrera?: string;
  semestre?: string;
  ultimoAcceso: string;
}

export interface Requisito {
  id: string;
  descripcion: string;
  obligatorio: boolean;
}

export type CategoriaServicio = 'academico' | 'administrativo' | 'identidad';

export const ETIQUETA_CATEGORIA: Record<CategoriaServicio, string> = {
  academico: 'Académico',
  administrativo: 'Administrativo',
  identidad: 'Identidad',
};

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Emoji usado como marca visual del servicio en el catálogo. */
  icono: string;
  /** Color de fondo del recuadro del icono (token del prototipo). */
  color: string;
  categoria: CategoriaServicio;
  requisitos: Requisito[];
  plantilla: string;
  activo: boolean;
  /** Tiempo estimado de respuesta, en días hábiles. */
  diasEstimados: number;
}

export interface Adjunto {
  id: string;
  nombre: string;
  /** Tamaño en bytes. */
  tamano: number;
  tipo: string;
  subidoEn: string;
}

/**
 * Entrada del historial. Es inmutable por contrato: se crea al ejecutar una
 * transición y nunca se edita ni se elimina.
 */
export interface EntradaHistorial {
  readonly id: string;
  readonly solicitudId: string;
  readonly autorId: string;
  readonly autorNombre: string;
  readonly fecha: string;
  readonly estadoAnterior: EstadoSolicitud | null;
  readonly estadoNuevo: EstadoSolicitud;
  readonly comentario: string | null;
}

export type Prioridad = 'normal' | 'alta';

export interface Solicitud {
  id: string;
  servicioId: string;
  solicitanteId: string;
  estado: EstadoSolicitud;
  creadaEn: string;
  actualizadaEn: string;
  enviadaEn: string | null;
  /** Respuestas del formulario dinámico, indexadas por nombre de campo. */
  datosFormulario: Record<string, string>;
  adjuntos: Adjunto[];
  historial: readonly EntradaHistorial[];
  /** Observación visible únicamente para el equipo administrativo. */
  comentarioInterno: string;
  asignadaA: string | null;
  prioridad: Prioridad;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sesión
// ─────────────────────────────────────────────────────────────────────────────

/** Actor que ejecuta una acción de dominio. */
export interface Actor {
  id: string;
  nombre: string;
  rol: Rol;
}
