import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

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

afterEach(() => {
  cleanup();
  localStorage.clear();
});
