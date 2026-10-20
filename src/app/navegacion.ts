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
    { etiqueta: 'Cuadro de mando', icono: 'grafico', a: RUTAS.cuadroMando },
  ],
  coordinador: [
    { etiqueta: 'Cuadro de mando', icono: 'grafico', a: RUTAS.cuadroMando },
    {
      etiqueta: 'Bandeja de entrada',
      icono: 'bandeja',
      a: RUTAS.bandeja,
      contador: 'solicitudesPendientes',
    },
  ],
  administrador: [
    { etiqueta: 'Inicio', icono: 'inicio', a: RUTAS.inicioAdmin },
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

/** Entrada del menú lateral que corresponde a la ruta actual, incluidas las de detalle. */
export function claveActiva(ruta: string, elementos: readonly ElementoNavegacion[]): string {
  if (ruta.startsWith(PREFIJOS.nuevaSolicitud)) return RUTAS.catalogo;
  if (ruta.startsWith(PREFIJOS.detalleSolicitud)) return RUTAS.inicio;
  // La coincidencia exacta manda; si no hay, el prefijo más largo (`/admin`
  // no debe marcarse en `/admin/usuarios`).
  const exacta = elementos.find((e) => ruta === e.a);
  if (exacta) return exacta.a;
  return (
    elementos.filter((e) => ruta.startsWith(`${e.a}/`)).sort((a, b) => b.a.length - a.a.length)[0]
      ?.a ?? ''
  );
}
