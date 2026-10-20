/** Pruebas de la paleta, las variables CSS y el cambio de tema. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProveedorUI, SelectorTema } from '@/components/ui';

import { cv, NOMBRES_TOKENS, variablesCss } from './css';
import { useTema } from './temaStore';
import { COLORES_MARCA, PALETAS, type ModoTema, type Paleta } from './tokens';

/** Contraste WCAG entre dos colores hexadecimales. */
function contraste(a: string, b: string): number {
  const luminancia = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Pares de texto sobre fondo que la interfaz usa de verdad. */
function paresDeTexto(p: Paleta): [string, string, string][] {
  return [
    ['texto principal', p.ink.DEFAULT, p.surface.DEFAULT],
    ['texto secundario sobre tarjeta', p.ink[3], p.surface.DEFAULT],
    ['texto secundario sobre fondo', p.ink[3], p.canvas.DEFAULT],
    ['enlace / realce rojo', p.primary.dark, p.surface.DEFAULT],
    ['realce rojo sobre tinte', p.primary.dark, p.primary.light],
    ['botón primario', p.white, p.primary.DEFAULT],
    ['texto del marco', p.white, p.chrome.DEFAULT],
    ['menú seleccionado', p.white, p.chrome.activo],
    ['éxito', p.success.DEFAULT, p.success.light],
    ['advertencia', p.warning.DEFAULT, p.warning.light],
    ['información', p.info.DEFAULT, p.info.light],
    ['error', p.danger.DEFAULT, p.danger.light],
    ['completada', p.emerald.DEFAULT, p.emerald.light],
    ['corregida', p.sky.DEFAULT, p.sky.light],
    ['neutro', p.neutral.DEFAULT, p.neutral.light],
    ...(['red', 'blue', 'green', 'amber', 'purple', 'teal'] as const).map(
      (color) =>
        [`avatar ${color}`, p.avatar[`${color}-fg`], p.avatar[`${color}-bg`]] as [
          string,
          string,
          string,
        ],
    ),
  ];
}

describe('paleta', () => {
  it.each(['claro', 'oscuro'] as ModoTema[])(
    'el tema %s supera 4,5:1 en todos los pares de texto',
    (modo) => {
      for (const [uso, texto, fondo] of paresDeTexto(PALETAS[modo])) {
        expect(contraste(texto, fondo), `${modo}: ${uso}`).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it('usa los colores oficiales de INTEC y el mismo marco en ambos temas', () => {
    expect(PALETAS.claro.primary.DEFAULT).toBe('#E4002B');
    expect(PALETAS.claro.chrome.activo).toBe('#93070A');
    // Gris INTEC sombreado (Gris 100 % al 43 % con negro).
    expect(PALETAS.claro.chrome.DEFAULT).toBe('#2B2C2E');
    expect(PALETAS.oscuro.chrome.DEFAULT).toBe(PALETAS.claro.chrome.DEFAULT);
  });

  it.each(['claro', 'oscuro'] as ModoTema[])(
    'en el tema %s el logo y el filete del seleccionado superan 3:1 sobre el marco',
    (modo) => {
      const marco = PALETAS[modo].chrome.DEFAULT;
      expect(contraste(COLORES_MARCA.rojoIntec, marco), 'hexágono del logo').toBeGreaterThanOrEqual(
        3,
      );
      expect(
        contraste(PALETAS[modo].chrome.filete, marco),
        'filete del seleccionado',
      ).toBeGreaterThanOrEqual(3);
    },
  );
});

describe('variables CSS', () => {
  it('declara cada token en ambos temas', () => {
    const hoja = variablesCss();
    const [claro, oscuro] = hoja.split('[data-theme="oscuro"]') as [string, string];
    for (const nombre of NOMBRES_TOKENS) {
      expect(claro).toContain(`--c-${nombre}:`);
      expect(oscuro).toContain(`--c-${nombre}:`);
    }
    expect(claro).toContain('--c-primary:228 0 43;');
  });

  it('traduce la ruta de un token a su variable', () => {
    expect(cv('success.light')).toBe('rgb(var(--c-success-light))');
    expect(cv('primary.DEFAULT')).toBe('rgb(var(--c-primary))');
    expect(cv('chrome.activo', 0.25)).toBe('rgb(var(--c-chrome-activo) / 0.25)');
  });
});

describe('SelectorTema', () => {
  beforeEach(() => useTema.setState({ modo: 'claro' }));

  it('arranca en claro y alterna al oscuro, marcando el documento', async () => {
    const usuario = userEvent.setup();
    render(
      <ProveedorUI>
        <SelectorTema />
      </ProveedorUI>,
    );

    expect(document.documentElement.dataset.theme).toBe('claro');
    await usuario.click(screen.getByRole('button', { name: 'Usar tema oscuro' }));

    expect(document.documentElement.dataset.theme).toBe('oscuro');
    expect(screen.getByRole('button', { name: 'Usar tema claro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(JSON.parse(localStorage.getItem('servis:tema') ?? '{}').state.modo).toBe('oscuro');
  });
});
