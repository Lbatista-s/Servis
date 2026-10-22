/**
 * Exportación a CSV, compartida por el cuadro de mando y la bandeja.
 *
 * Se genera en UTF-8 con BOM y separado por comas, que Excel abre con los
 * acentos correctos.
 */

import { descargarBlob } from './descargas';

export type FilaCsv = readonly (string | number | null | undefined)[];

/**
 * Una celda entre comillas. Las que empiezan como una fórmula (`=`, `+`, `-`,
 * `@`) llevan un apóstrofo delante para que la hoja de cálculo no las ejecute.
 */
function celda(valor: FilaCsv[number]): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export function generarCsv(filas: readonly FilaCsv[]): string {
  return filas.map((fila) => fila.map(celda).join(',')).join('\r\n');
}

/** Descarga las filas como `<prefijo>-AAAA-MM-DD.csv`. */
export function descargarCsv(filas: readonly FilaCsv[], prefijo: string): void {
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBlob(
    new Blob(['﻿', generarCsv(filas)], { type: 'text/csv;charset=utf-8' }),
    `${prefijo}-${fecha}.csv`,
  );
}
