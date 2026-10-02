/**
 * Variables CSS de la paleta, una por token y por tema.
 *
 * Cada variable guarda los canales RGB (`--c-canvas: 239 240 240`) para que
 * Tailwind pueda aplicar opacidades (`bg-primary/15`). El tema claro vive en
 * `:root` y el oscuro en `[data-theme="oscuro"]`, de modo que cambiar de tema
 * es cambiar un atributo: no hace falta volver a renderizar nada.
 */

import { PALETAS, type Paleta } from './tokens';

type Arbol = { [clave: string]: string | Arbol };

/** Aplana la paleta: `primary.DEFAULT` → `primary`, `ink.2` → `ink-2`. */
function aplanar(arbol: Arbol, prefijo = ''): [string, string][] {
  return Object.entries(arbol).flatMap(([clave, valor]) => {
    const nombre = clave === 'DEFAULT' ? prefijo : prefijo ? `${prefijo}-${clave}` : clave;
    return typeof valor === 'string'
      ? [[nombre, valor] as [string, string]]
      : aplanar(valor, nombre);
  });
}

function canales(hex: string): string {
  const limpio = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)).join(' ');
}

const tokensDe = (paleta: Paleta) => aplanar(paleta as unknown as Arbol);

/** Nombres de todos los tokens de color (iguales en ambos temas). */
export const NOMBRES_TOKENS: readonly string[] = tokensDe(PALETAS.claro).map(([nombre]) => nombre);

/** Hoja de estilos con las variables de los dos temas. */
export function variablesCss(): string {
  const bloque = (paleta: Paleta) =>
    tokensDe(paleta)
      .map(([nombre, hex]) => `--c-${nombre}:${canales(hex)};`)
      .join('');
  return (
    `:root{${bloque(PALETAS.claro)}color-scheme:light;}` +
    `[data-theme="oscuro"]{${bloque(PALETAS.oscuro)}color-scheme:dark;}`
  );
}

/**
 * Color de un token como valor CSS que sigue al tema activo, para estilos en
 * línea: `cv('success.light')` → `rgb(var(--c-success-light))`.
 */
export function cv(token: string, opacidad?: number): string {
  const nombre = token.replace(/\.DEFAULT$/, '').replace(/\./g, '-');
  return opacidad === undefined
    ? `rgb(var(--c-${nombre}))`
    : `rgb(var(--c-${nombre}) / ${opacidad})`;
}

/**
 * Colores para Tailwind: la misma forma que la paleta, pero cada hoja apunta
 * a su variable (`rgb(var(--c-ink-3) / <alpha-value>)`).
 */
export function coloresTailwind(): Arbol {
  const convertir = (arbol: Arbol, prefijo = ''): Arbol =>
    Object.fromEntries(
      Object.entries(arbol).map(([clave, valor]) => {
        const nombre = clave === 'DEFAULT' ? prefijo : prefijo ? `${prefijo}-${clave}` : clave;
        return [
          clave,
          typeof valor === 'string'
            ? `rgb(var(--c-${nombre}) / <alpha-value>)`
            : convertir(valor, nombre),
        ];
      }),
    );
  return convertir(PALETAS.claro as unknown as Arbol);
}
