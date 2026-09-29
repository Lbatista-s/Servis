/**
 * Tokens de diseño de SERVIS, alineados con la línea gráfica institucional.
 *
 * Es la única fuente de verdad de la paleta: la consumen tanto Tailwind
 * (`tailwind.config.ts`) como el tema de Ant Design (`./antd.ts`), de modo que
 * los componentes de la librería y las utilidades de maquetación nunca
 * divergen. Los valores coinciden con la colección «SERVIS · Tokens» del
 * archivo de Figma.
 *
 * Colores oficiales de la línea gráfica: Rojo INTEC `#E4002B`, Vino INTEC
 * `#93070A`, Gris INTEC `#63666A`, negro, blanco y el azul de apoyo `#052A47`.
 * El resto son derivados para la interfaz (fondos, bordes y estados), todos
 * con un contraste mínimo de 4,5:1 cuando se usan como texto.
 */

export const COLORES = {
  white: '#FFFFFF',
  primary: {
    DEFAULT: '#E4002B',
    hover: '#93070A',
    dark: '#93070A',
    light: '#FDE8EC',
    'light-2': '#F9C9D2',
  },
  // Escala de texto neutra, derivada del negro y del Gris INTEC
  ink: {
    DEFAULT: '#000000',
    2: '#3F4246',
    3: '#63666A',
    4: '#B1B3B6',
  },
  canvas: {
    DEFAULT: '#F4F5F6',
    2: '#ECEDEE',
    3: '#E2E3E5',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    2: '#F9FAFA',
  },
  line: {
    DEFAULT: '#DEDFE1',
    2: '#CBCDD0',
  },
  success: {
    DEFAULT: '#15803D',
    light: '#DCFCE7',
    hover: '#166534',
  },
  warning: {
    DEFAULT: '#A14A07',
    light: '#FEF3C7',
    hover: '#7C3A06',
    soft: '#FEF3E8',
  },
  info: {
    DEFAULT: '#1D4ED8',
    light: '#DBEAFE',
  },
  danger: {
    DEFAULT: '#B91C1C',
    light: '#FEE2E2',
    hover: '#991B1B',
  },
  emerald: {
    DEFAULT: '#047857',
    light: '#ECFDF5',
  },
  sky: {
    DEFAULT: '#0369A1',
    light: '#E0F2FE',
  },
  neutral: {
    DEFAULT: '#63666A',
    light: '#F1F2F3',
    dashed: '#C3C5C8',
    ink: '#63666A',
  },
  // Azul de apoyo: barra lateral y panel izquierdo del acceso
  shell: {
    DEFAULT: '#052A47',
    gradient: '#031C30',
  },
  avatar: {
    'red-bg': '#FDE8EC',
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
