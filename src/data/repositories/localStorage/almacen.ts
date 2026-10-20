/**
 * Acceso de bajo nivel al almacén en `localStorage`.
 *
 * Es el único módulo de la aplicación autorizado a tocar `localStorage`
 * directamente (la regla de ESLint `no-restricted-globals` lo impide en el
 * resto del código). Todo lo demás pasa por los repositorios.
 */

import { construirSolicitudesDemo, SERVICIOS_DEMO, USUARIOS_DEMO } from '@/data/seed';
import { construirHistorialDemo } from '@/data/seedHistorial';
import { METAS_POR_DEFECTO } from '@/domain/indicadores/definiciones';
import { CLAVE_ALMACEN, migrar, SERVIS_SCHEMA_VERSION, type Almacen } from '@/data/schema';

/**
 * Construye un almacén nuevo con los datos de demostración: las solicitudes
 * del prototipo y un historial cerrado de los seis meses anteriores a `ahora`
 * para el cuadro de mando.
 */
export function almacenInicial(ahora: Date = new Date()): Almacen {
  return {
    version: SERVIS_SCHEMA_VERSION,
    solicitudes: [...construirSolicitudesDemo(), ...construirHistorialDemo(ahora)],
    usuarios: [...USUARIOS_DEMO],
    servicios: SERVICIOS_DEMO.map((s) => ({ ...s, requisitos: [...s.requisitos] })),
    metas: { ...METAS_POR_DEFECTO },
  };
}

/**
 * Lee el almacén, migrándolo si procede. Si no existe, está corrupto o su
 * esquema no es migrable, siembra de nuevo con los datos de demostración.
 */
export function leerAlmacen(): Almacen {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CLAVE_ALMACEN);
  } catch {
    // Modo privado del navegador o almacenamiento deshabilitado: se trabaja en
    // memoria durante la sesión.
    return almacenInicial();
  }

  if (bruto === null) {
    const inicial = almacenInicial();
    escribirAlmacen(inicial);
    return inicial;
  }

  let analizado: unknown;
  try {
    analizado = JSON.parse(bruto);
  } catch {
    const inicial = almacenInicial();
    escribirAlmacen(inicial);
    return inicial;
  }

  const migrado = migrar(analizado);
  if (migrado === null) {
    const inicial = almacenInicial();
    escribirAlmacen(inicial);
    return inicial;
  }

  // Si la migración avanzó de versión, se persiste el resultado para no
  // repetirla en cada arranque.
  if (
    typeof (analizado as { version?: unknown }).version !== 'number' ||
    (analizado as { version: number }).version !== migrado.version
  ) {
    escribirAlmacen(migrado);
  }

  return migrado;
}

export function escribirAlmacen(almacen: Almacen): void {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(almacen));
  } catch {
    // Cuota agotada o almacenamiento no disponible: se ignora en silencio para
    // no interrumpir la demostración.
  }
}

/** Lee, transforma y persiste el almacén en una sola operación. */
export function actualizarAlmacen<T>(operacion: (almacen: Almacen) => [Almacen, T]): T {
  const [siguiente, resultado] = operacion(leerAlmacen());
  escribirAlmacen(siguiente);
  return resultado;
}

/** Devuelve el almacén a los datos de demostración iniciales. */
export function restablecerAlmacen(): Almacen {
  const inicial = almacenInicial();
  escribirAlmacen(inicial);
  return inicial;
}

/**
 * Simula la latencia de una llamada de red. Mantiene el código de la interfaz
 * honesto respecto a la asincronía, de modo que los estados de carga que se
 * escriban hoy sigan siendo correctos cuando exista un backend real.
 */
export function resolver<T>(valor: T): Promise<T> {
  return Promise.resolve(valor);
}
