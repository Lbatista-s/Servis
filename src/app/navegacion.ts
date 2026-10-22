/** Definición de la navegación lateral por rol. */

import type { NombreIcono } from '@/components/ui';
import type { Rol } from '@/domain/types';

import { PREFIJOS, RUTAS } from './rutas';

export interface ElementoNavegacion {
  etiqueta: string;
  icono: NombreIcono;
  /** Ruta de destino; puede llevar consulta (`/bandeja?vista=asignadas`). */
  a: string;
  /** Clave del contador que se muestra como distintivo, si procede. */
  contador?: ClaveContador;
}

export type ClaveContador =
  'misSolicitudesActivas' | 'solicitudesPendientes' | 'asignadasAMi' | 'devueltas';

export interface GrupoNavegacion {
  titulo: string;
  elementos: readonly ElementoNavegacion[];
}

/** Vistas rápidas de la bandeja: cada una abre la bandeja con su filtro. */
export const VISTAS_BANDEJA = {
  pendientes: `${RUTAS.bandeja}?vista=pendientes`,
  asignadas: `${RUTAS.bandeja}?vista=asignadas`,
  devueltas: `${RUTAS.bandeja}?vista=devueltas`,
} as const;

const GRUPO_BANDEJA: GrupoNavegacion = {
  titulo: 'Bandeja',
  elementos: [
    { etiqueta: 'Todas las solicitudes', icono: 'bandeja', a: RUTAS.bandeja },
    {
      etiqueta: 'Pendientes',
      icono: 'reloj',
      a: VISTAS_BANDEJA.pendientes,
      contador: 'solicitudesPendientes',
    },
    {
      etiqueta: 'Asignadas a mí',
      icono: 'usuario',
      a: VISTAS_BANDEJA.asignadas,
      contador: 'asignadasAMi',
    },
    {
      etiqueta: 'Devueltas',
      icono: 'rotar',
      a: VISTAS_BANDEJA.devueltas,
      contador: 'devueltas',
    },
  ],
};

const GRUPO_ESTRATEGIA: GrupoNavegacion = {
  titulo: 'Estrategia',
  elementos: [{ etiqueta: 'Cuadro de mando', icono: 'grafico', a: RUTAS.cuadroMando }],
};

export const NAVEGACION_POR_ROL: Record<Rol, readonly GrupoNavegacion[]> = {
  estudiante: [
    {
      titulo: 'Principal',
      elementos: [
        { etiqueta: 'Inicio', icono: 'inicio', a: RUTAS.inicio },
        { etiqueta: 'Catálogo de servicios', icono: 'cuadricula', a: RUTAS.catalogo },
      ],
    },
    {
      titulo: 'Mis trámites',
      elementos: [
        {
          etiqueta: 'Mis solicitudes',
          icono: 'documento',
          a: RUTAS.misSolicitudes,
          contador: 'misSolicitudesActivas',
        },
        { etiqueta: 'Mis documentos', icono: 'carpeta', a: RUTAS.misDocumentos },
      ],
    },
  ],
  // El personal trabaja la cola: la bandeja va primero.
  personal_administrativo: [GRUPO_BANDEJA, GRUPO_ESTRATEGIA],
  // El coordinador dirige: primero la estrategia.
  coordinador: [GRUPO_ESTRATEGIA, GRUPO_BANDEJA],
  administrador: [
    {
      titulo: 'Administración',
      elementos: [
        { etiqueta: 'Inicio', icono: 'inicio', a: RUTAS.inicioAdmin },
        { etiqueta: 'Gestión de usuarios', icono: 'usuarios', a: RUTAS.usuarios },
        { etiqueta: 'Catálogo de servicios', icono: 'cuadricula', a: RUTAS.servicios },
      ],
    },
  ],
};

/** Todas las entradas de un rol, sin agrupar. */
export function elementosDe(grupos: readonly GrupoNavegacion[]): ElementoNavegacion[] {
  return grupos.flatMap((grupo) => grupo.elementos);
}

interface TituloPantalla {
  titulo: string;
  subtitulo: string;
}

/** Título y subtítulo de la barra superior para cada ruta. */
const TITULOS: Record<string, TituloPantalla> = {
  [RUTAS.inicio]: { titulo: 'Inicio', subtitulo: 'Bienvenido a SERVIS' },
  [RUTAS.catalogo]: {
    titulo: 'Catálogo de servicios',
    subtitulo: 'Todos los servicios disponibles',
  },
  [RUTAS.misSolicitudes]: { titulo: 'Mis solicitudes', subtitulo: 'Todos tus trámites' },
  [RUTAS.misDocumentos]: { titulo: 'Mis documentos', subtitulo: 'Documentos emitidos' },
  [RUTAS.bandeja]: { titulo: 'Bandeja de entrada', subtitulo: 'Solicitudes recibidas' },
  [RUTAS.cuadroMando]: {
    titulo: 'Cuadro de mando',
    subtitulo: 'Estrategia del Área de Ingenierías',
  },
  [RUTAS.inicioAdmin]: { titulo: 'Inicio', subtitulo: 'Administración del sistema' },
  [RUTAS.usuarios]: { titulo: 'Gestión de usuarios', subtitulo: 'Usuarios registrados' },
  [RUTAS.servicios]: { titulo: 'Catálogo de servicios', subtitulo: 'Plantillas y requisitos' },
};

/** Títulos de las pantallas con parámetros; el orden importa (de más a menos específica). */
const TITULOS_POR_PREFIJO: readonly [string, TituloPantalla][] = [
  [
    PREFIJOS.nuevaSolicitud,
    { titulo: 'Nueva solicitud', subtitulo: 'Completa el formulario por pasos' },
  ],
  [
    PREFIJOS.detalleSolicitud,
    { titulo: 'Detalle de la solicitud', subtitulo: 'Seguimiento del trámite' },
  ],
  [
    PREFIJOS.detalleBandeja,
    { titulo: 'Revisión de solicitud', subtitulo: 'Acciones del personal administrativo' },
  ],
];

/** Resuelve el título de la barra superior, admitiendo rutas con parámetros. */
export function titulosDe(ruta: string): TituloPantalla {
  return (
    TITULOS[ruta] ??
    TITULOS_POR_PREFIJO.find(([prefijo]) => ruta.startsWith(prefijo))?.[1] ?? {
      titulo: 'SERVIS',
      subtitulo: 'Servicios institucionales',
    }
  );
}

/**
 * Entrada del menú lateral que corresponde a la ubicación actual, incluidas
 * las de detalle. `busqueda` es la consulta (`?vista=…`), que distingue las
 * vistas rápidas de la bandeja.
 */
export function claveActiva(
  ruta: string,
  busqueda: string,
  elementos: readonly ElementoNavegacion[],
): string {
  if (ruta.startsWith(PREFIJOS.nuevaSolicitud)) return RUTAS.catalogo;
  if (ruta.startsWith(PREFIJOS.detalleSolicitud)) return RUTAS.misSolicitudes;
  const completa = `${ruta}${busqueda}`;
  // La coincidencia exacta manda; si no hay, el prefijo más largo (`/admin`
  // no debe marcarse en `/admin/usuarios`).
  const exacta = elementos.find((e) => completa === e.a) ?? elementos.find((e) => ruta === e.a);
  if (exacta) return exacta.a;
  return (
    elementos.filter((e) => ruta.startsWith(`${e.a}/`)).sort((a, b) => b.a.length - a.a.length)[0]
      ?.a ?? ''
  );
}
