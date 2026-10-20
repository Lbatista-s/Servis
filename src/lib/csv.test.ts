import { describe, expect, it } from 'vitest';

import { generarCsv } from './csv';

describe('generarCsv', () => {
  it('entrecomilla las celdas, duplica las comillas y separa filas con CRLF', () => {
    expect(
      generarCsv([
        ['ID', 'Nota'],
        ['SRV-1', 'Dijo "sí", luego no'],
      ]),
    ).toBe('"ID","Nota"\r\n"SRV-1","Dijo ""sí"", luego no"');
  });

  it('deja vacías las celdas sin valor y escribe los números', () => {
    expect(generarCsv([[null, undefined, 3]])).toBe('"","","3"');
  });

  it('neutraliza las celdas que una hoja de cálculo tomaría por fórmulas', () => {
    expect(generarCsv([['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)']])).toBe(
      `"'=HYPERLINK(""x"")","'+1","'-2","'@SUM(A1)"`,
    );
  });
});
