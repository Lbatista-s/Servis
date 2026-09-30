/**
 * Versionado y migración del esquema almacenado.
 *
 * El almacenamiento local del profesor no debe romperse porque cambie la forma
 * de los datos entre entregas. Cada versión del esquema tiene una función que
 * transforma la anterior; al arrancar, `migrar` aplica en cadena las que falten.
 */

import { crearDocumento } from '@/domain/documentos';
import { construirHistorialDemo } from '@/data/seedHistorial';
import { METAS_POR_DEFECTO, type Metas } from '@/domain/indicadores/definiciones';
import type { Servicio, Solicitud, Usuario } from '@/domain/types';

/** Versión actual del esquema. Incrementar al cambiar la forma de los datos. */
export const SERVIS_SCHEMA_VERSION = 3;

/** Clave única bajo la que se guarda todo el almacén. */
export const CLAVE_ALMACEN = 'servis:datos';

export interface Almacen {
  version: number;
  solicitudes: Solicitud[];
  usuarios: Usuario[];
  servicios: Servicio[];
  /** Metas del cuadro de mando, fijadas por el coordinador. */
  metas: Metas;
}

/** Forma sin tipar de un almacén leído del disco, antes de migrarlo. */
type AlmacenBruto = Record<string, unknown>;

/**
 * Migraciones indexadas por la versión de origen. `MIGRACIONES[n]` convierte un
 * almacén en versión `n` a la versión `n + 1`.
 *
 * Ejemplo para la próxima entrega:
 *
 * ```ts
 * 1: (almacen) => ({
 *   ...almacen,
 *   solicitudes: (almacen.solicitudes as Solicitud[]).map((s) => ({ ...s, sede: 'Santo Domingo' })),
 * }),
 * ```
 */
const MIGRACIONES: Record<number, (almacen: AlmacenBruto) => AlmacenBruto> = {
  // v2: las solicitudes guardan su documento de salida.
  1: (almacen) => {
    const servicios = almacen.servicios as Servicio[];
    return {
      ...almacen,
      solicitudes: (almacen.solicitudes as Omit<Solicitud, 'documento'>[]).map((s) => ({
        ...s,
        documento:
          s.estado === 'completada'
            ? crearDocumento(
                s.id,
                servicios.find((servicio) => servicio.id === s.servicioId)?.nombre ?? s.servicioId,
                new Date(s.actualizadaEn),
              )
            : null,
      })),
    };
  },
  // v3: metas del cuadro de mando y el historial cerrado que lo alimenta.
  2: (almacen) => ({
    ...almacen,
    solicitudes: [...(almacen.solicitudes as Solicitud[]), ...construirHistorialDemo(new Date())],
    metas: { ...METAS_POR_DEFECTO },
  }),
};

/** Comprueba que el valor leído tenga la forma mínima de un almacén. */
function pareceAlmacen(valor: unknown): valor is AlmacenBruto {
  if (typeof valor !== 'object' || valor === null) return false;
  const objeto = valor as AlmacenBruto;
  return (
    Array.isArray(objeto.solicitudes) &&
    Array.isArray(objeto.usuarios) &&
    Array.isArray(objeto.servicios)
  );
}

/**
 * Lleva un almacén leído del disco hasta la versión actual del esquema.
 *
 * Devuelve `null` cuando los datos son irrecuperables (formato irreconocible o
 * versión futura); en ese caso quien llama debe volver a sembrar desde cero, que
 * es preferible a arrancar con datos corruptos.
 */
export function migrar(bruto: unknown): Almacen | null {
  if (!pareceAlmacen(bruto)) return null;

  const versionLeida = typeof bruto.version === 'number' ? bruto.version : 0;

  // Un almacén escrito por una versión más nueva de la aplicación no se puede
  // degradar de forma segura.
  if (versionLeida > SERVIS_SCHEMA_VERSION) return null;

  let actual: AlmacenBruto = bruto;
  for (let version = versionLeida; version < SERVIS_SCHEMA_VERSION; version += 1) {
    const migracion = MIGRACIONES[version];
    // Sin migración registrada para ese salto, los datos no son recuperables.
    if (!migracion) return null;
    actual = migracion(actual);
  }

  return {
    version: SERVIS_SCHEMA_VERSION,
    solicitudes: actual.solicitudes as Solicitud[],
    usuarios: actual.usuarios as Usuario[],
    servicios: actual.servicios as Servicio[],
    // Se completan las metas que falten (p. ej. un indicador añadido después).
    metas: { ...METAS_POR_DEFECTO, ...(actual.metas as Partial<Metas> | undefined) },
  };
}
