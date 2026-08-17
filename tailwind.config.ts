import type { Config } from 'tailwindcss';

/**
 * Design tokens extraídos literalmente del prototipo de alta fidelidad
 * `SERVIS_HiFi_Prototipo.html` (bloque `:root`). Ningún componente debe
 * declarar valores hexadecimales sueltos: todo color, radio, sombra y
 * dimensión estructural se consume desde aquí.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primario institucional INTEC (--p, --ph, --pd, --pl, --pl2)
        primary: {
          DEFAULT: '#C8102E',
          hover: '#A50D26',
          dark: '#87001E',
          light: '#FEF1F3',
          'light-2': '#FFD9DF',
        },
        // Escala de texto cálida (--ink … --ink4)
        ink: {
          DEFAULT: '#130806',
          2: '#5C3832',
          3: '#9E7A74',
          4: '#C4A49F',
        },
        // Fondos de página (--bg, --bg2, --bg3)
        canvas: {
          DEFAULT: '#F6F4F2',
          2: '#EFEDEA',
          3: '#E6E2DE',
        },
        // Superficies elevadas (--sur, --sur2)
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#FAF8F7',
        },
        // Bordes (--bdr, --bdr2)
        line: {
          DEFAULT: '#E0DBD7',
          2: '#D0C9C4',
        },
        // Semánticos
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
          hover: '#15803D',
        },
        warning: {
          DEFAULT: '#C05709',
          light: '#FEF3C7',
          hover: '#9A3D06',
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
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        sky: {
          DEFAULT: '#0369A1',
          light: '#E0F2FE',
        },
        neutral: {
          DEFAULT: '#7A6F6B',
          light: '#F1F0EF',
          dashed: '#C4BEBA',
          ink: '#6B6460',
        },
        // Chrome oscuro: barra lateral y panel izquierdo del login
        shell: {
          DEFAULT: '#1A0C0A',
          gradient: '#3A1010',
        },
        // Paleta de avatares (--av-*)
        avatar: {
          'red-bg': '#FFE4E6',
          'red-fg': '#9B1827',
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
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
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
        // --r4 … --r16, --rFull
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        // --s1 … --s5
        s1: '0 1px 2px rgba(19,8,6,.06)',
        s2: '0 1px 3px rgba(19,8,6,.10), 0 1px 2px rgba(19,8,6,.06)',
        s3: '0 4px 8px -1px rgba(19,8,6,.12), 0 2px 4px -1px rgba(19,8,6,.06)',
        s4: '0 10px 24px -4px rgba(19,8,6,.14), 0 4px 8px -2px rgba(19,8,6,.06)',
        s5: '0 24px 48px -8px rgba(19,8,6,.18), 0 8px 16px -4px rgba(19,8,6,.08)',
        // Anillo de foco del prototipo: `box-shadow:0 0 0 3px rgba(200,16,46,.1)`
        'focus-primary': '0 0 0 3px rgba(200,16,46,.10)',
        'ring-primary': '0 0 0 3px rgba(200,16,46,.20)',
      },
      spacing: {
        // Dimensiones estructurales (--sidebar-w, --topbar-h)
        sidebar: '228px',
        topbar: '60px',
      },
      keyframes: {
        'modal-in': {
          from: { opacity: '0', transform: 'scale(.95) translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'overlay-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'modal-in': 'modal-in .2s cubic-bezier(.34,1.56,.64,1)',
        'overlay-in': 'overlay-in .15s ease-out',
        'toast-in': 'toast-in .2s cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
};

export default config;
