/**
 * Tema de Ant Design construido sobre los tokens de SERVIS.
 *
 * Los tokens globales fijan la marca: Rojo INTEC como color de acción, Open
 * Sans, radios y alturas de control. Por componente sólo se ajusta lo que la
 * línea gráfica pide: el marco (barra lateral y superior) en Gris INTEC, con el
 * Vino para lo seleccionado y el hover, las cabeceras de tabla y los botones.
 */

import { theme, type ThemeConfig } from 'antd';

import { ESTRUCTURA, FUENTES, PALETAS, RADIOS, type ModoTema } from './tokens';

const fuente = (familias: readonly string[]) => familias.join(', ');

/** Vino INTEC translúcido para el hover del menú sobre el marco gris. */
const HOVER_MENU = 'rgba(147,7,10,.45)';
/** Blanco con opacidad suficiente para superar 4,5:1 sobre el Gris INTEC. */
const TEXTO_MARCO = 'rgba(255,255,255,.9)';

export function crearTemaAntd(modo: ModoTema): ThemeConfig {
  const p = PALETAS[modo];
  return {
    cssVar: { prefix: 'servis' },
    algorithm: modo === 'oscuro' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: p.primary.DEFAULT,
      colorSuccess: p.success.DEFAULT,
      colorWarning: p.warning.DEFAULT,
      colorError: p.danger.DEFAULT,
      colorInfo: p.info.DEFAULT,
      // Los enlaces van en Vino (claro) o Rojo 70 % (oscuro): el Rojo puro no
      // llega a 4,5:1 sobre los fondos grises.
      colorLink: p.primary.dark,
      colorLinkHover: p.primary.DEFAULT,

      colorText: p.ink.DEFAULT,
      colorTextSecondary: p.ink[2],
      colorTextTertiary: p.ink[3],
      colorTextQuaternary: p.ink[4],
      colorTextPlaceholder: p.ink[3],
      colorTextDescription: p.ink[3],

      colorBgLayout: p.canvas.DEFAULT,
      colorBgContainer: p.surface.DEFAULT,
      colorBgElevated: modo === 'oscuro' ? p.surface[2] : p.surface.DEFAULT,
      colorFillAlter: p.surface[2],
      colorBorder: p.line[2],
      colorBorderSecondary: p.line.DEFAULT,
      colorSplit: p.line.DEFAULT,

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
        siderBg: p.chrome.DEFAULT,
        headerBg: p.chrome.DEFAULT,
        bodyBg: p.canvas.DEFAULT,
        headerHeight: ESTRUCTURA.barraSuperior,
        headerPadding: '0 28px',
      },
      Menu: {
        darkItemBg: p.chrome.DEFAULT,
        darkSubMenuItemBg: p.chrome.DEFAULT,
        darkPopupBg: p.chrome.DEFAULT,
        darkItemColor: TEXTO_MARCO,
        darkItemHoverColor: p.white,
        darkItemHoverBg: HOVER_MENU,
        darkItemSelectedBg: p.chrome.activo,
        darkItemSelectedColor: p.white,
        darkGroupTitleColor: TEXTO_MARCO,
        itemHeight: 40,
        itemMarginInline: 8,
        itemBorderRadius: RADIOS.DEFAULT,
        groupTitleFontSize: 10,
      },
      Card: {
        headerFontSize: 14,
      },
      Table: {
        headerBg: p.surface[2],
        headerColor: p.ink[3],
        headerSplitColor: 'transparent',
        rowHoverBg: p.surface[2],
        cellPaddingBlock: 12,
        cellPaddingInline: 14,
      },
      Modal: {
        titleFontSize: 18,
      },
      Tooltip: {
        colorBgSpotlight: p.chrome.DEFAULT,
      },
      Descriptions: {
        labelColor: p.ink[3],
        contentColor: p.ink.DEFAULT,
        itemPaddingBottom: 12,
      },
      Tag: {
        defaultBg: p.neutral.light,
        defaultColor: p.neutral.DEFAULT,
      },
    },
  };
}
