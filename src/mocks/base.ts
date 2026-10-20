/**
 * Estado del servidor simulado.
 *
 * Mientras no exista el backend de Django, la API la responde MSW (ver
 * `handlers.ts`) sobre estos datos. Se guardan en el formato del dominio y se
 * persisten en `localStorage` para que lo que se haga en la aplicación
 * sobreviva a una recarga. Los archivos subidos sólo viven en memoria.
 */

import { METAS_POR_DEFECTO, type Metas } from '@/domain/indicadores/definiciones';
import { ESTADOS_FINALES, type Servicio, type Solicitud, type Usuario } from '@/domain/types';

import { construirSolicitudesDemo, SERVICIOS_DEMO, USUARIOS_DEMO } from './datos/seed';
import { construirHistorialDemo } from './datos/seedHistorial';
import { marcarLeidas, notificacionesDe } from './notificaciones';

export { CONTRASENA_SIMULADA } from './cuentas';

export interface BaseSimulada {
  version: number;
  usuarios: Usuario[];
  servicios: Servicio[];
  solicitudes: Solicitud[];
  metas: Metas;
  /** Notificaciones leídas por cada usuario (ver `notificaciones.ts`). */
  leidas: Record<string, string[]>;
  /** Usuario con la sesión abierta (la «cookie de sesión» del servidor simulado). */
  sesion: string | null;
}

const VERSION = 2;
const CLAVE = 'servis:api-simulada';
/** Clave del antiguo modo de demostración, que ya no se usa. */
const CLAVE_ANTIGUA = 'servis:datos';

let base: BaseSimulada | null = null;
const archivos = new Map<string, Blob>();

function sembrar(ahora = new Date()): BaseSimulada {
  const sembrada: BaseSimulada = {
    version: VERSION,
    usuarios: USUARIOS_DEMO.map((u) => ({ ...u })),
    servicios: SERVICIOS_DEMO.map((s) => ({ ...s, requisitos: [...s.requisitos] })),
    solicitudes: [...construirSolicitudesDemo(), ...construirHistorialDemo(ahora)],
    metas: { ...METAS_POR_DEFECTO },
    leidas: {},
    sesion: null,
  };
  // Los avisos de solicitudes ya cerradas se dan por leídos: sólo queda
  // pendiente lo que sigue abierto (por ejemplo, SRV-1038 para el personal).
  const cerradas = new Set(
    sembrada.solicitudes.filter((s) => ESTADOS_FINALES.includes(s.estado)).map((s) => s.id),
  );
  for (const usuario of sembrada.usuarios) {
    marcarLeidas(
      sembrada,
      usuario.id,
      notificacionesDe(sembrada, usuario)
        .filter((n) => cerradas.has(n.solicitudId))
        .map((n) => n.id),
    );
  }
  return sembrada;
}

function leerGuardada(): BaseSimulada | null {
  try {
    localStorage.removeItem(CLAVE_ANTIGUA);
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) return null;
    const leida = JSON.parse(bruto) as BaseSimulada;
    return leida.version === VERSION ? leida : null;
  } catch {
    return null;
  }
}

/** Datos vigentes; la primera vez los carga o los siembra. */
export function baseSimulada(): BaseSimulada {
  base ??= leerGuardada() ?? sembrar();
  return base;
}

/** Persiste los cambios hechos sobre `baseSimulada()`. */
export function guardarBase(): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(baseSimulada()));
  } catch {
    // Sin almacenamiento disponible, los datos viven sólo durante la sesión.
  }
}

/**
 * Vuelve a los datos iniciales y descarta los archivos subidos. Desde la
 * aplicación se conserva la sesión abierta: las cuentas sembradas no cambian.
 */
export function restablecerApiSimulada({
  ahora,
  conservarSesion = false,
}: { ahora?: Date; conservarSesion?: boolean } = {}): void {
  const sesion = conservarSesion ? (base?.sesion ?? null) : null;
  base = sembrar(ahora);
  base.sesion = sesion;
  archivos.clear();
  guardarBase();
}

/** Abre (o cierra, con `null`) la sesión del servidor simulado. Útil en pruebas. */
export function iniciarSesionSimulada(usuarioId: string | null): void {
  baseSimulada().sesion = usuarioId;
  guardarBase();
}

export function guardarArchivo(id: string, contenido: Blob): void {
  archivos.set(id, contenido);
}

export function leerArchivo(id: string): Blob | undefined {
  return archivos.get(id);
}
