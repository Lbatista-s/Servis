/** Arranca la API simulada en el navegador (Service Worker de MSW). */

import { setupWorker } from 'msw/browser';

import { clienteConsultas } from '@/hooks/clienteConsultas';

import { handlers } from './handlers';

/**
 * Tiempo oculta a partir del cual se reactiva la simulación al volver. El
 * navegador detiene un service worker inactivo a los ~30 s; con margen.
 */
const INACTIVIDAD_MS = 20_000;

const opciones = {
  // Lo que no es de la API (fuentes, imágenes, el propio Vite) pasa de largo.
  onUnhandledRequest: 'bypass',
  quiet: true,
} as const;

export async function iniciarApiSimulada(): Promise<void> {
  const worker = setupWorker(...handlers);
  await worker.start(opciones);

  // Si el navegador detiene el service worker (pestaña inactiva), al
  // reanudarse ha olvidado qué pestañas simulan y deja pasar las peticiones
  // al servidor real. Al volver a la pestaña se reactiva y se recargan los
  // datos que pudieron fallar mientras tanto.
  let ocultaDesde: number | null = null;
  let reactivando: Promise<void> | null = null;

  async function reactivar() {
    worker.stop();
    await worker.start(opciones);
    await clienteConsultas.invalidateQueries();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      ocultaDesde = Date.now();
      return;
    }
    const inactiva = ocultaDesde !== null && Date.now() - ocultaDesde >= INACTIVIDAD_MS;
    ocultaDesde = null;
    if (!inactiva || reactivando) return;
    reactivando = reactivar().finally(() => {
      reactivando = null;
    });
  });
}
