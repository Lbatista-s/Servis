/** Arranca la API simulada en el navegador (Service Worker de MSW). */

import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export async function iniciarApiSimulada(): Promise<void> {
  await setupWorker(...handlers).start({
    // Lo que no es de la API (fuentes, imágenes, el propio Vite) pasa de largo.
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
