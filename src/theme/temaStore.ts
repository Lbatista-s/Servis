/**
 * Tema de color activo (claro u oscuro), recordado en el navegador.
 *
 * Arranca en claro. El atributo `data-theme` del documento lo fija también el
 * script de `index.html` antes del primer pintado, para evitar un destello.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PALETAS, type ModoTema, type Paleta } from './tokens';

/** Clave de almacenamiento; `index.html` la lee con el mismo nombre. */
export const CLAVE_TEMA = 'servis:tema';

interface EstadoTema {
  modo: ModoTema;
  alternar: () => void;
  fijar: (modo: ModoTema) => void;
}

export const useTema = create<EstadoTema>()(
  persist(
    (set) => ({
      modo: 'claro',
      alternar: () => set((estado) => ({ modo: estado.modo === 'claro' ? 'oscuro' : 'claro' })),
      fijar: (modo) => set({ modo }),
    }),
    { name: CLAVE_TEMA },
  ),
);

/** Paleta del tema activo, para las APIs que necesitan el color en hexadecimal. */
export function usePaleta(): Paleta {
  return PALETAS[useTema((estado) => estado.modo)];
}
