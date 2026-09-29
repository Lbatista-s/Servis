/**
 * Tokens de diseño de SERVIS, alineados con el manual de identidad de INTEC
 * (identidad.intec.edu.do/manual-de-uso/colores).
 *
 * Es la única fuente de verdad de la paleta: la consumen Tailwind (a través de
 * variables CSS, ver `./css.ts`) y el tema de Ant Design (`./antd.ts`).
 *
 * Colores oficiales: Rojo INTEC `#E4002B` (primario), Vino INTEC `#93070A` y
 * Gris INTEC `#63666A` (secundarios), con sus tintes al 70, 50, 30 y 10 %.
 * En la interfaz el Rojo es el color de acción, el Vino marca lo seleccionado
 * y los estados de interacción, y el Gris viste el marco de la aplicación.
 * El azul `#052A47` queda como color de apoyo, fuera del marco.
 *
 * Todo par de texto y fondo de ambas paletas supera 4,5:1 (lo comprueba
 * `tokens.test.ts`).
 */

/** Estructura común de las dos paletas: mismas claves, distintos valores. */
export interface Paleta {
  white: string;
  primary: { DEFAULT: string; hover: string; dark: string; light: string; 'light-2': string };
  ink: { DEFAULT: string; 2: string; 3: string; 4: string };
  canvas: { DEFAULT: string; 2: string; 3: string };
  surface: { DEFAULT: string; 2: string };
  line: { DEFAULT: string; 2: string };
  success: { DEFAULT: string; light: string; hover: string };
  warning: { DEFAULT: string; light: string; hover: string; soft: string };
  info: { DEFAULT: string; light: string };
  danger: { DEFAULT: string; light: string; hover: string };
  emerald: { DEFAULT: string; light: string };
  sky: { DEFAULT: string; light: string };
  neutral: { DEFAULT: string; light: string; dashed: string; ink: string };
  /** Marco de la aplicación: barra lateral, barra superior y panel del acceso. */
  chrome: { DEFAULT: string; activo: string };
  /** Azul de apoyo: acento ultrasecundario. */
  apoyo: { DEFAULT: string };
  avatar: Record<`${ColorPaleta}-${'bg' | 'fg'}`, string>;
}

type ColorPaleta = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'teal';

/** Tema claro: tintes oficiales del manual siempre que existen. */
const CLARO: Paleta = {
  white: '#FFFFFF',
  primary: {
    DEFAULT: '#E4002B', // Rojo INTEC
    hover: '#93070A', // Vino INTEC
    dark: '#93070A', // Texto rojo sobre fondos claros (el Rojo no llega a 4,5:1 en grises)
    light: '#FFEAE6', // Rojo 10 %
    'light-2': '#FFC2B8', // Rojo 30 %
  },
  ink: { DEFAULT: '#000000', 2: '#3F4246', 3: '#63666A', 4: '#B1B2B4' },
  canvas: { DEFAULT: '#EFF0F0', 2: '#E3E4E5', 3: '#D0D1D2' }, // Gris 10 %, intermedio, Gris 30 %
  surface: { DEFAULT: '#FFFFFF', 2: '#F7F8F8' },
  line: { DEFAULT: '#D0D1D2', 2: '#B1B2B4' }, // Gris 30 % y 50 %
  success: { DEFAULT: '#15803D', light: '#DCFCE7', hover: '#166534' },
  warning: { DEFAULT: '#A14A07', light: '#FEF3C7', hover: '#7C3A06', soft: '#FEF3E8' },
  info: { DEFAULT: '#1D4ED8', light: '#DBEAFE' },
  danger: { DEFAULT: '#B91C1C', light: '#FEE2E2', hover: '#991B1B' },
  emerald: { DEFAULT: '#047857', light: '#ECFDF5' },
  sky: { DEFAULT: '#0369A1', light: '#E0F2FE' },
  neutral: { DEFAULT: '#63666A', light: '#EFF0F0', dashed: '#B1B2B4', ink: '#63666A' },
  chrome: { DEFAULT: '#63666A', activo: '#93070A' }, // Gris INTEC y Vino INTEC
  apoyo: { DEFAULT: '#052A47' },
  avatar: {
    'red-bg': '#F4E5E7', // Vino 10 %
    'red-fg': '#93070A',
    'blue-bg': '#DBEAFE',
    'blue-fg': '#1D4ED8',
    'green-bg': '#DCFCE7',
    'green-fg': '#15803D',
    'amber-bg': '#FEF3C7',
    'amber-fg': '#B45309',
    'purple-bg': '#F3E8FF',
    'purple-fg': '#7C3AED',
    'teal-bg': '#CCFBF1',
    'teal-fg': '#0F766E',
  },
};

/**
 * Tema oscuro: neutros derivados del Gris INTEC. El rojo se mantiene en los
 * rellenos (botones) y pasa al Rojo 70 % `#FB6F64` cuando es texto; los
 * estados usan tonos claros sobre fondos profundos.
 */
const OSCURO: Paleta = {
  white: '#FFFFFF',
  primary: {
    DEFAULT: '#E4002B',
    hover: '#B34E58', // Vino 70 %
    dark: '#FB6F64', // Rojo 70 %
    light: '#3A1418',
    'light-2': '#5C1D24',
  },
  ink: { DEFAULT: '#F2F2F3', 2: '#D0D1D2', 3: '#B1B2B4', 4: '#7F8185' },
  canvas: { DEFAULT: '#141517', 2: '#1B1C1F', 3: '#2A2C30' },
  surface: { DEFAULT: '#1D1E21', 2: '#232528' },
  line: { DEFAULT: '#303236', 2: '#45484C' },
  success: { DEFAULT: '#4ADE80', light: '#0F2A1A', hover: '#22C55E' },
  warning: { DEFAULT: '#FBBF24', light: '#2E2208', hover: '#F59E0B', soft: '#2A1C0C' },
  info: { DEFAULT: '#93C5FD', light: '#14213D' },
  danger: { DEFAULT: '#FCA5A5', light: '#3B1212', hover: '#F87171' },
  emerald: { DEFAULT: '#6EE7B7', light: '#062A20' },
  sky: { DEFAULT: '#7DD3FC', light: '#0C2A3A' },
  neutral: { DEFAULT: '#B1B2B4', light: '#26282B', dashed: '#4A4D51', ink: '#B1B2B4' },
  chrome: { DEFAULT: '#2B2D31', activo: '#93070A' },
  apoyo: { DEFAULT: '#93C5FD' },
  avatar: {
    'red-bg': '#3A1418',
    'red-fg': '#FB6F64',
    'blue-bg': '#172554',
    'blue-fg': '#93C5FD',
    'green-bg': '#0F2A1A',
    'green-fg': '#86EFAC',
    'amber-bg': '#2E2208',
    'amber-fg': '#FCD34D',
    'purple-bg': '#2E1A47',
    'purple-fg': '#D8B4FE',
    'teal-bg': '#06302B',
    'teal-fg': '#5EEAD4',
  },
};

export type ModoTema = 'claro' | 'oscuro';

export const PALETAS: Record<ModoTema, Paleta> = { claro: CLARO, oscuro: OSCURO };

/**
 * Valores del tema claro. Sólo para lo que debe ser igual en ambos temas
 * (p. ej. los rellenos de los botones de éxito y advertencia, que llevan
 * texto blanco); lo que cambia con el tema se lee con `cv()` de `./css.ts`.
 */
export const COLORES = CLARO;

/** Colores del logotipo, tal como vienen en los archivos oficiales. */
export const COLORES_MARCA = {
  rojoIntec: '#ED1B30',
  rojo: '#E4002B',
  vino: '#93070A',
  gris: '#63666A',
  /** Rojo 30 %: realce legible sobre el marco gris en ambos temas. */
  rojo30: '#FFC2B8',
} as const;

/** Montserrat para títulos y Open Sans para el texto, según la línea gráfica. */
export const FUENTES = {
  texto: ['"Open Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  titulos: ['Montserrat', '"Open Sans"', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
} as const;

export const RADIOS = {
  xs: 4,
  sm: 6,
  DEFAULT: 8,
  md: 10,
  lg: 12,
  xl: 16,
} as const;

/** Dimensiones estructurales del armazón. */
export const ESTRUCTURA = {
  barraLateral: 228,
  barraSuperior: 60,
} as const;
