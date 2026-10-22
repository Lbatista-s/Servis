/** El logotipo cumple el «Modelo de logos auxiliares» del manual de INTEC. */

import { describe, expect, it } from 'vitest';

import { geometriaLogotipo } from './Logotipo';

type Punto = readonly [number, number];

const resta = (a: Punto, b: Punto): Punto => [a[0] - b[0], a[1] - b[1]];
const cruz = (a: Punto, b: Punto) => a[0] * b[1] - a[1] * b[0];

/** Distancia de un punto a la recta que pasa por `a` y `b`. */
function distanciaARecta(p: Punto, a: Punto, b: Punto) {
  const d = resta(b, a);
  return Math.abs(cruz(d, resta(p, a))) / Math.hypot(d[0], d[1]);
}

describe.each(['compacto', 'completo'] as const)('logotipo %s', (formato) => {
  const g = geometriaLogotipo(formato);

  it('el icono mide el 125 % del hexágono de INTEC', () => {
    const anchoIcono =
      Math.max(...g.contornoSimbolo.map((p) => p[0])) -
      Math.min(...g.contornoSimbolo.map((p) => p[0]));
    expect(anchoIcono).toBeCloseTo(133.4 * 1.25, 1);
  });

  it('el icono se apoya en el lado superior derecho de INTEC, paralelo a él', () => {
    const [a, b] = g.ladoIntec;
    const [c, d] = g.ladoSimbolo;
    // Paralelos: el producto vectorial de las direcciones es casi nulo.
    const ladoIntec = resta(b, a);
    const ladoIcono = resta(d, c);
    const seno = cruz(ladoIntec, ladoIcono) / (Math.hypot(...ladoIntec) * Math.hypot(...ladoIcono));
    expect(Math.abs(seno)).toBeLessThan(0.01);
    // Separados sólo por la holgura de los filetes.
    expect(distanciaARecta(c, a, b)).toBeCloseTo(3, 0);
    expect(distanciaARecta(d, a, b)).toBeCloseTo(3, 0);
    // Y por encima de INTEC: todo el icono queda sobre la recta del lado.
    expect(Math.max(...g.contornoSimbolo.map((p) => p[1]))).toBeLessThan(154 / 2);
  });

  it('el nombre va a la derecha del logo de INTEC sin tocar el icono', () => {
    const { x, y, ancho, alto } = g.cajaNombre;
    expect(x).toBeGreaterThan(133.4);
    // Ningún vértice del icono cae dentro de la caja del nombre…
    for (const [px, py] of g.contornoSimbolo) {
      expect(px > x && px < x + ancho && py > y && py < y + alto).toBe(false);
    }
    // …y el lado inferior derecho del icono pasa por encima del nombre.
    const inferior = g.contornoSimbolo[3];
    const derecha = g.contornoSimbolo[2];
    if (!inferior || !derecha) throw new Error('Contorno incompleto.');
    const t = (x - inferior[0]) / (derecha[0] - inferior[0]);
    const yLadoEnX = inferior[1] + (derecha[1] - inferior[1]) * t;
    expect(yLadoEnX).toBeLessThan(y);
  });

  it('la caja del dibujo contiene todas las piezas', () => {
    const { caja } = g;
    for (const [px, py] of g.contornoSimbolo) {
      expect(px).toBeGreaterThanOrEqual(caja.x);
      expect(py).toBeGreaterThanOrEqual(caja.y);
      expect(px).toBeLessThanOrEqual(caja.x + caja.ancho);
    }
    expect(g.cajaNombre.x + g.cajaNombre.ancho).toBeLessThanOrEqual(caja.x + caja.ancho);
    expect(caja.y + caja.alto).toBeGreaterThanOrEqual(154);
  });
});
