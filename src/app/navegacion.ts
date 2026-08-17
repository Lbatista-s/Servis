/** Definición de la navegación lateral por rol. */

import type { NombreIcono } from '@/components/ui';
import type { Rol } from '@/domain/types';

import { RUTAS } from './rutas';

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

/** Título y subtítulo de la barra superior para cada ruta. */
export const TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
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
