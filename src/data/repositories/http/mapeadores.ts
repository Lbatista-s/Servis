/**
 * Traducción entre el JSON de la API y los tipos del dominio.
 *
 * El cliente ya convierte las claves a `camelCase`; aquí se normaliza el resto
 * (identificadores numéricos de Django → texto, campos opcionales, valores por
 * defecto de presentación). Si el backend nombra algún campo distinto a
 * `docs/api.md`, éste es el sitio donde adaptarlo.
 */

import {
  COLORES_AVATAR,
  type Adjunto,
  type ColorAvatar,
  type Documento,
  type EntradaHistorial,
  type Requisito,
  type Servicio,
  type Solicitud,
  type Usuario,
} from '@/domain/types';

/** Objeto JSON ya convertido a `camelCase`. */
export type Dto = Record<string, unknown>;

const texto = (valor: unknown, porDefecto = ''): string =>
  valor === null || valor === undefined ? porDefecto : String(valor);

const textoONulo = (valor: unknown): string | null =>
  valor === null || valor === undefined || valor === '' ? null : String(valor);

const opcional = (valor: unknown): string | undefined =>
  valor === null || valor === undefined || valor === '' ? undefined : String(valor);

const lista = (valor: unknown): Dto[] => (Array.isArray(valor) ? (valor as Dto[]) : []);

function inicialesDe(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

/** Color estable derivado del identificador, si la API no envía uno. */
function colorDe(id: string): ColorAvatar {
  const suma = [...id].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return COLORES_AVATAR[suma % COLORES_AVATAR.length] ?? 'blue';
}

// ─────────────────────────────────────────────────────────────────────────────
// API → dominio
// ─────────────────────────────────────────────────────────────────────────────

export function aUsuario(dto: Dto): Usuario {
  const id = texto(dto.id);
  const nombre = texto(dto.nombre);
  const color = texto(dto.colorAvatar);
  return {
    id,
    nombre,
    correo: texto(dto.correo),
    rol: texto(dto.rol) as Usuario['rol'],
    iniciales: texto(dto.iniciales) || inicialesDe(nombre),
    colorAvatar: (COLORES_AVATAR as readonly string[]).includes(color)
      ? (color as ColorAvatar)
      : colorDe(id),
    activo: dto.activo === undefined ? true : Boolean(dto.activo),
    matricula: opcional(dto.matricula),
    carrera: opcional(dto.carrera),
    semestre: opcional(dto.semestre),
    ultimoAcceso: texto(dto.ultimoAcceso),
  };
}

function aRequisito(dto: Dto): Requisito {
  return {
    id: texto(dto.id),
    descripcion: texto(dto.descripcion),
    obligatorio: Boolean(dto.obligatorio),
  };
}

export function aServicio(dto: Dto): Servicio {
  return {
    id: texto(dto.id),
    nombre: texto(dto.nombre),
    descripcion: texto(dto.descripcion),
    icono: texto(dto.icono, '📄'),
    color: texto(dto.color, 'bg-canvas'),
    categoria: texto(dto.categoria, 'administrativo') as Servicio['categoria'],
    requisitos: lista(dto.requisitos).map(aRequisito),
    plantilla: texto(dto.plantilla),
    activo: Boolean(dto.activo),
    diasEstimados: Number(dto.diasEstimados ?? 0),
  };
}

export function aAdjunto(dto: Dto): Adjunto {
  return {
    id: texto(dto.id),
    nombre: texto(dto.nombre),
    tamano: Number(dto.tamano ?? 0),
    tipo: texto(dto.tipo, 'application/octet-stream'),
    subidoEn: texto(dto.subidoEn),
  };
}

function aEntradaHistorial(dto: Dto, solicitudId: string): EntradaHistorial {
  return Object.freeze({
    id: texto(dto.id),
    solicitudId: texto(dto.solicitudId, solicitudId),
    autorId: texto(dto.autorId),
    autorNombre: texto(dto.autorNombre),
    fecha: texto(dto.fecha),
    estadoAnterior: textoONulo(dto.estadoAnterior) as EntradaHistorial['estadoAnterior'],
    estadoNuevo: texto(dto.estadoNuevo) as EntradaHistorial['estadoNuevo'],
    comentario: textoONulo(dto.comentario),
  });
}

function aDocumento(valor: unknown): Documento | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const dto = valor as Dto;
  return { nombre: texto(dto.nombre), generadoEn: texto(dto.generadoEn) };
}

export function aSolicitud(dto: Dto): Solicitud {
  const id = texto(dto.id);
  const datos = (dto.datosFormulario ?? {}) as Record<string, unknown>;
  return {
    id,
    servicioId: texto(dto.servicioId),
    solicitanteId: texto(dto.solicitanteId),
    estado: texto(dto.estado) as Solicitud['estado'],
    creadaEn: texto(dto.creadaEn),
    actualizadaEn: texto(dto.actualizadaEn),
    enviadaEn: textoONulo(dto.enviadaEn),
    datosFormulario: Object.fromEntries(
      Object.entries(datos).map(([campo, valor]) => [campo, texto(valor)]),
    ),
    adjuntos: lista(dto.adjuntos).map(aAdjunto),
    historial: lista(dto.historial).map((entrada) => aEntradaHistorial(entrada, id)),
    comentarioInterno: texto(dto.comentarioInterno),
    asignadaA: textoONulo(dto.asignadaA),
    prioridad: dto.prioridad === 'alta' ? 'alta' : 'normal',
    documento: aDocumento(dto.documento),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dominio → API (el cliente convierte después las claves a `snake_case`)
// ─────────────────────────────────────────────────────────────────────────────

/** Credenciales de inicio de sesión, igual para sesión y para JWT. */
export function desdeCredenciales(correo: string, contrasena: string): Dto {
  return { correo: correo.trim(), contrasena };
}

/**
 * Quita del objeto las claves que el servidor calcula (identificador, fechas
 * de auditoría) o que no deben viajar.
 */
export function sinClaves<T extends object>(objeto: T, claves: readonly (keyof T)[]): Dto {
  return Object.fromEntries(
    Object.entries(objeto).filter(([clave]) => !claves.includes(clave as keyof T)),
  );
}
