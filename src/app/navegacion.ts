/** Definición de la navegación lateral por rol. */

import type { NombreIcono } from '@/components/ui';
import type { Rol } from '@/domain/types';

import { PREFIJOS, RUTAS } from './rutas';

export interface ElementoNavegacion {
  etiqueta: string;
  icono: NombreIcono;
  a: string;
  /** Clave del contador que se muestra como distintivo, si procede. */
  contador?: 'solicitudesPendientes' | 'misSolicitudesActivas';
}

export const NAVEGACION_POR_ROL: Record<Rol, readonly ElementoNavegacion[]> = {
  estudiante: [
    { etiqueta: 'Inicio', icono: 'inicio', a: RUTAS.inicio, contador: 'misSolicitudesActivas' },
    { etiqueta: 'Catálogo de servicios', icono: 'cuadricula', a: RUTAS.catalogo },
  ],
  personal_administrativo: [
    {
      etiqueta: 'Bandeja de entrada',
      icono: 'bandeja',
      a: RUTAS.bandeja,
      contador: 'solicitudesPendientes',
    },
    { etiqueta: 'Reportes', icono: 'grafico', a: RUTAS.reportes },
  ],
  coordinador: [
    {
      etiqueta: 'Bandeja de entrada',
      icono: 'bandeja',
      a: RUTAS.bandeja,
      contador: 'solicitudesPendientes',
    },
    { etiqueta: 'Reportes', icono: 'grafico', a: RUTAS.reportes },
  ],
  administrador: [
    { etiqueta: 'Gestión de usuarios', icono: 'usuarios', a: RUTAS.usuarios },
    { etiqueta: 'Catálogo de servicios', icono: 'cuadricula', a: RUTAS.servicios },
  ],
};

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
  [RUTAS.bandeja]: { titulo: 'Bandeja de entrada', subtitulo: 'Solicitudes recibidas' },
  [RUTAS.reportes]: { titulo: 'Reportes', subtitulo: 'Área de Ingenierías' },
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

/** Entrada del menú lateral que corresponde a la ruta actual, incluidas las de detalle. */
export function claveActiva(ruta: string, elementos: readonly ElementoNavegacion[]): string {
  if (ruta.startsWith(PREFIJOS.nuevaSolicitud)) return RUTAS.catalogo;
  if (ruta.startsWith(PREFIJOS.detalleSolicitud)) return RUTAS.inicio;
  return elementos.find((e) => ruta === e.a || ruta.startsWith(`${e.a}/`))?.a ?? '';
}
