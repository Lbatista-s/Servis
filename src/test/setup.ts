import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

import { clienteConsultas } from '@/hooks/clienteConsultas';
import { restablecerApiSimulada } from '@/mocks/base';
import { servidorSimulado } from '@/mocks/servidor';

// Ajustes para las pruebas con DOM (jsdom). Las de datos corren en el entorno
// `node`, cuyo `fetch` sí sabe enviar archivos en un `FormData`.
if (typeof window !== 'undefined') {
  // Ant Design consulta `matchMedia` para sus puntos de ruptura; jsdom no lo implementa.
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (consulta: string): MediaQueryList => ({
        matches: false,
        media: consulta,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // El área de texto con altura automática observa su tamaño; jsdom no trae ResizeObserver.
  if (!('ResizeObserver' in window)) {
    class ResizeObserverSimulado {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverSimulado,
    });
    Object.defineProperty(globalThis, 'ResizeObserver', {
      writable: true,
      value: ResizeObserverSimulado,
    });
  }

  // jsdom no implementa `getComputedStyle` con pseudoelemento, que Ant Design
  // consulta al medir la barra de desplazamiento; basta con el estilo del elemento.
  const getComputedStyleOriginal = window.getComputedStyle.bind(window);
  window.getComputedStyle = (elemento: Element) => getComputedStyleOriginal(elemento);
}

// Las pruebas hablan con la API simulada, como la aplicación. Una petición sin
// manejador es un error: indica un endpoint que falta en el servidor simulado.
beforeAll(() => servidorSimulado.listen({ onUnhandledRequest: 'error' }));
afterAll(() => servidorSimulado.close());

beforeEach(() => {
  // Cada prueba parte de los datos iniciales y sin sesión.
  restablecerApiSimulada();
});

afterEach(() => {
  cleanup();
  servidorSimulado.resetHandlers();
  // Cada prueba parte de una caché vacía.
  clienteConsultas.clear();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
