import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import { entorno } from './config/entorno';
import './index.css';

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontró el elemento #root en index.html.');
}

/**
 * Sin backend, la API la responde un servidor simulado. Se importa bajo
 * demanda: con la API real no forma parte de lo que descarga el navegador.
 */
async function prepararApi(): Promise<void> {
  if (!entorno().apiSimulada) return;
  const { iniciarApiSimulada } = await import('./mocks/navegador');
  await iniciarApiSimulada();
}

void prepararApi().then(() => {
  createRoot(contenedor).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
