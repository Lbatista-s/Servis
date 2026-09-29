import type { Config } from 'tailwindcss';

import { coloresTailwind } from './src/theme/css';
import { ESTRUCTURA, FUENTES, RADIOS } from './src/theme/tokens';

/**
 * Tailwind se usa para la maquetación y los detalles que Ant Design no cubre.
 * La paleta, las fuentes y los radios salen de `src/theme/tokens.ts`, la misma
 * fuente que alimenta el tema de Ant Design. Los colores apuntan a variables
 * CSS (`src/theme/css.ts`), así que cada clase cambia sola con el tema claro u
 * oscuro. Ningún componente debe declarar valores hexadecimales sueltos.
 */
const px = (valor: number) => `${valor}px`;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: coloresTailwind(),
      fontFamily: {
        sans: [...FUENTES.texto],
        display: [...FUENTES.titulos],
        mono: [...FUENTES.mono],
      },
      fontSize: {
        // Escala tipográfica observada en el prototipo
        '2xs': ['10px', '1.4'],
        xs: ['11px', '1.45'],
        sm: ['12px', '1.5'],
        base: ['13px', '1.5'],
        md: ['14px', '1.5'],
        lg: ['15px', '1.5'],
        xl: ['16px', '1.4'],
        '2xl': ['18px', '1.35'],
        '3xl': ['20px', '1.3'],
        '4xl': ['22px', '1.25'],
        '5xl': ['26px', '1.2'],
        '6xl': ['28px', '1'],
      },
      borderRadius: {
        xs: px(RADIOS.xs),
        sm: px(RADIOS.sm),
        DEFAULT: px(RADIOS.DEFAULT),
        md: px(RADIOS.md),
        lg: px(RADIOS.lg),
        xl: px(RADIOS.xl),
        full: '9999px',
      },
      boxShadow: {
        s1: '0 1px 2px rgba(0,0,0,.06)',
        s2: '0 1px 3px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.06)',
        s3: '0 4px 8px -1px rgba(0,0,0,.12), 0 2px 4px -1px rgba(0,0,0,.06)',
        s4: '0 10px 24px -4px rgba(0,0,0,.14), 0 4px 8px -2px rgba(0,0,0,.06)',
        s5: '0 24px 48px -8px rgba(0,0,0,.18), 0 8px 16px -4px rgba(0,0,0,.08)',
        // Anillo de foco con el Rojo INTEC
        'focus-primary': '0 0 0 3px rgba(228,0,43,.12)',
        'ring-primary': '0 0 0 3px rgba(228,0,43,.20)',
      },
      spacing: {
        sidebar: px(ESTRUCTURA.barraLateral),
        topbar: px(ESTRUCTURA.barraSuperior),
      },
      keyframes: {
        'overlay-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'overlay-in': 'overlay-in .15s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
