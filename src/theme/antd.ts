/**
 * Tema de Ant Design construido sobre los tokens de SERVIS.
 *
 * Los tokens globales fijan la marca (Rojo INTEC como primario, Open Sans,
 * radios y alturas de control del prototipo). Los tokens por componente
 * ajustan sólo lo que la línea gráfica pide de forma explícita: la barra
 * lateral en azul de apoyo, las cabeceras de tabla y el peso de los botones.
 */

import type { ThemeConfig } from 'antd';

import { COLORES, ESTRUCTURA, FUENTES, RADIOS } from './tokens';

const fuente = (familias: readonly string[]) => familias.join(', ');

export const temaAntd: ThemeConfig = {
  cssVar: { prefix: 'servis' },
  token: {
    colorPrimary: COLORES.primary.DEFAULT,
    colorSuccess: COLORES.success.DEFAULT,
    colorWarning: COLORES.warning.DEFAULT,
    colorError: COLORES.danger.DEFAULT,
    colorInfo: COLORES.info.DEFAULT,
    // Los enlaces van en Vino INTEC: el rojo sobre fondos grises no llega a 4,5:1.
    colorLink: COLORES.primary.dark,
    colorLinkHover: COLORES.primary.DEFAULT,

    colorText: COLORES.ink.DEFAULT,
    colorTextSecondary: COLORES.ink[2],
    colorTextTertiary: COLORES.ink[3],
    colorTextQuaternary: COLORES.ink[4],
    colorTextPlaceholder: COLORES.ink[3],
    colorTextDescription: COLORES.ink[3],

    colorBgLayout: COLORES.canvas.DEFAULT,
    colorBgContainer: COLORES.surface.DEFAULT,
    colorFillAlter: COLORES.surface[2],
    colorBorder: COLORES.line[2],
    colorBorderSecondary: COLORES.line.DEFAULT,
    colorSplit: COLORES.line.DEFAULT,

    fontFamily: fuente(FUENTES.texto),
    fontFamilyCode: fuente(FUENTES.mono),
    fontSize: 13,

    borderRadius: RADIOS.DEFAULT,
    borderRadiusSM: RADIOS.sm,
    borderRadiusLG: RADIOS.lg,
    borderRadiusXS: RADIOS.xs,

    controlHeight: 36,
    controlHeightSM: 28,
    controlHeightLG: 42,

    boxShadow: '0 10px 24px -4px rgba(0,0,0,.14), 0 4px 8px -2px rgba(0,0,0,.06)',
    boxShadowSecondary: '0 10px 24px -4px rgba(0,0,0,.14), 0 4px 8px -2px rgba(0,0,0,.06)',
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Layout: {
      siderBg: COLORES.shell.DEFAULT,
      headerBg: COLORES.surface.DEFAULT,
      bodyBg: COLORES.canvas.DEFAULT,
      headerHeight: ESTRUCTURA.barraSuperior,
      headerPadding: '0 28px',
    },
    Menu: {
      darkItemBg: COLORES.shell.DEFAULT,
      darkSubMenuItemBg: COLORES.shell.DEFAULT,
      darkPopupBg: COLORES.shell.DEFAULT,
      darkItemColor: 'rgba(255,255,255,.72)',
      darkItemHoverColor: '#FFFFFF',
      darkItemHoverBg: 'rgba(255,255,255,.06)',
      darkItemSelectedBg: COLORES.primary.DEFAULT,
      darkItemSelectedColor: '#FFFFFF',
      darkGroupTitleColor: 'rgba(255,255,255,.55)',
      itemHeight: 40,
      itemMarginInline: 8,
      itemBorderRadius: RADIOS.DEFAULT,
      groupTitleFontSize: 10,
    },
    Card: {
      headerFontSize: 14,
    },
    Table: {
      headerBg: COLORES.surface[2],
      headerColor: COLORES.ink[3],
      headerSplitColor: 'transparent',
      rowHoverBg: COLORES.surface[2],
      cellPaddingBlock: 12,
      cellPaddingInline: 14,
    },
    Modal: {
      titleFontSize: 18,
    },
    Tooltip: {
      colorBgSpotlight: COLORES.shell.DEFAULT,
    },
    Descriptions: {
      labelColor: COLORES.ink[3],
      contentColor: COLORES.ink.DEFAULT,
      itemPaddingBottom: 12,
    },
    Tag: {
      defaultBg: COLORES.neutral.light,
      defaultColor: COLORES.neutral.DEFAULT,
    },
  },
};
