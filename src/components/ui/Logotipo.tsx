/**
 * Logotipo de SERVIS en vector, construido según la regla de logos auxiliares
 * del manual de identidad de INTEC (co-branding):
 *
 * - el logo comercial de INTEC, con sus trazos oficiales (extraídos del PDF
 *   descargable del manual, sin alterar forma ni color);
 * - un hexágono propio con el símbolo S de SERVIS, un 125 % mayor que el
 *   hexágono de INTEC;
 * - el nombre en mayúsculas y Vino INTEC (Montserrat ExtraBold, equivalente
 *   libre de la Gotham Black del manual).
 *
 * Versiones: `color` para fondos claros y `negativo` (textos en blanco) para
 * el marco gris. El logo comercial puede ir sobre cualquier fondo salvo Rojo
 * o Vino sólidos, así que ninguna de las dos lo coloca sobre esos colores.
 */

import { cn } from '@/lib/utils';
import { COLORES_MARCA } from '@/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Geometría
// ─────────────────────────────────────────────────────────────────────────────

/** Hexágono de INTEC: 133,4 × 154 unidades (tamaño del archivo oficial). */
const ANCHO_INTEC = 133.4;
const ALTO_INTEC = 154.05;
/** Símbolo S dibujado en una caja de 98 × 114 unidades. */
const ANCHO_SIMBOLO = 98;
/** El hexágono de SERVIS mide el 125 % del de INTEC. */
const ESCALA_SIMBOLO = (ANCHO_INTEC * 1.25) / ANCHO_SIMBOLO;
const ALTO_SERVIS = 114 * ESCALA_SIMBOLO;
/** Solape horizontal entre los hexágonos: sólo se tocan los filetes. */
const SOLAPE = 4;
const X_SERVIS = ANCHO_INTEC - SOLAPE;
const X_TEXTO = X_SERVIS + ANCHO_SIMBOLO * ESCALA_SIMBOLO + 26;

/** Logo comercial de INTEC: hexágono con filete blanco, hexágono rojo y nombre. */
function HexagonoIntec({ y }: { y: number }) {
  return (
    <g transform={`translate(-15.02 ${y - 15.02})`}>
      <path
        transform="matrix(1,0,0,-1,15.0208,53.535905)"
        d="M0 0 66.705 38.516 133.406 0V-77.028L66.705-115.535 0-77.028Z"
        fill="#FFFFFF"
      />
      <path
        transform="matrix(1,0,0,-1,22.53,57.8733)"
        d="M0 0 59.191 34.178 118.379 0 118.387-34.17 118.379-68.352 59.191-102.521 0-68.352Z"
        fill={COLORES_MARCA.rojoIntec}
      />
      <path
        transform="matrix(1,0,0,-1,106.8669,114.847)"
        d="M0 0 2.591-5.145C-.381-7.172-4.018-8.308-7.604-8.308-14.789-8.308-21.102-2.786-21.102 4.436-21.102 7.224-20.162 9.765-18.592 11.823H-26.444V1.23C-26.444-1.164-25.404-2.72-21.739-2.72L-21.409-2.715C-20.194-4.677-18.447-6.295-16.388-7.412-19.615-8.259-21.059-8.402-23.569-8.388-28.868-8.358-32.731-5.601-32.731-.084V22.152L-26.444 24.937V17.191H-7.515C-2.54 17.152 1.834 14.187 3.978 9.77L-12.681-.425C-12.206-1.419-10.863-2.831-7.938-2.831-4.829-2.831-2.53-1.649 0 0M-15.072 3.822-3.679 10.62C-4.829 11.751-6.317 12.176-7.938 12.176-11.769 12.176-14.832 9.11-15.167 5.43-15.167 4.906-15.167 4.386-15.072 3.822M26.546 15.094 23.23 10.457C21.596 11.433 19.812 12.315 17.885 12.315 13.231 12.315 9.77 9.288 9.77 4.795 9.77 .499 13.726-2.72 16.993-2.72 19.566-2.72 21.004-2.137 23.035-.815L26.501-5.26C24.071-7.659 20.308-8.388 17.092-8.388 10.605-8.388 3.479-3.359 3.479 4.989 3.479 12.507 9.965 17.978 17.291 17.978 20.95 17.978 23.773 16.852 26.546 15.094M-68.167 21.73C-68.167 24.342-65.981 26.457-63.279 26.457-60.583 26.457-58.398 24.342-58.398 21.73-58.398 19.12-60.583 17.007-63.279 17.007-65.981 17.007-68.167 19.12-68.167 21.73M-67.081-7.622V16.899C-66.027 16.107-64.698 15.633-63.267 15.633-61.874 15.633-60.602 16.071-59.57 16.808V-7.606ZM-57.272-7.622V17.082H-51.002V14.362H-50.9C-48.775 17.191-46.694 17.978-43.178 17.978-37.977 17.978-34.517 14.7-34.517 9.432L-34.454-1.991C-34.273-4.503-33.228-6.382-31.589-7.622H-40.802V7.771C-40.802 10.411-42.041 12.603-44.859 12.603-48.817 12.603-50.651 9.632-50.651 6.502V-7.606Z"
        fill="#FFFFFF"
      />
    </g>
  );
}

/**
 * Símbolo de SERVIS: una S continua con flecha de flujo y dos acentos
 * cuadrados, dentro de un hexágono Vino con filete.
 */
export function SimboloServis({ filete }: { filete: string }) {
  return (
    <>
      <polygon
        points="50,1 99,29.3 99,86.7 50,115 1,86.7 1,29.3"
        fill="none"
        stroke={filete}
        strokeWidth="1.6"
      />
      <polygon points="50,6.5 94.2,32 94.2,84 50,109.5 5.8,84 5.8,32" fill={COLORES_MARCA.vino} />
      <g fill="none" stroke="#FFFFFF" strokeWidth="11">
        <path d="M60 38 H42 A11.25 11.25 0 0 0 42 60.5 H46" />
        <path d="M56 60.5 H58 A11.25 11.25 0 0 1 58 83 H40" />
      </g>
      <g fill="#FFFFFF">
        <polygon points="45,51.5 54,60.5 45,69.5" />
        <rect x="63.5" y="32.5" width="11" height="11" rx="2" />
        <rect x="25.5" y="77.5" width="11" height="11" rx="2" />
      </g>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

export interface LogotipoProps {
  /** `completo` incluye el descriptor; `compacto` es para espacios reducidos. */
  formato?: 'completo' | 'compacto';
  /** `color` para fondos claros; `negativo` para el marco gris u oscuro. */
  version?: 'color' | 'negativo';
  /** Alto en píxeles; el ancho se ajusta a la proporción del logotipo. */
  alto?: number;
  className?: string;
}

const FUENTE_TITULOS = 'Montserrat, "Open Sans", sans-serif';

export function Logotipo({
  formato = 'completo',
  version = 'color',
  alto = 48,
  className,
}: LogotipoProps) {
  const negativo = version === 'negativo';
  const colorNombre = negativo ? '#FFFFFF' : COLORES_MARCA.vino;
  const colorDescriptor = negativo ? 'rgba(255,255,255,.92)' : COLORES_MARCA.gris;
  const completo = formato === 'completo';

  const ancho = X_TEXTO + (completo ? 520 : 440);
  const altoCaja = ALTO_SERVIS;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${altoCaja}`}
      height={alto}
      width={(alto * ancho) / altoCaja}
      role="img"
      aria-label="SERVIS — Servicios académicos y administrativos automatizados, INTEC"
      className={cn('shrink-0', className)}
    >
      <HexagonoIntec y={altoCaja - ALTO_INTEC - 4} />

      <g transform={`translate(${X_SERVIS} 0) scale(${ESCALA_SIMBOLO}) translate(-1 -1)`}>
        <SimboloServis filete={negativo ? '#FFFFFF' : COLORES_MARCA.vino} />
      </g>

      <g fontFamily={FUENTE_TITULOS} fill={colorNombre}>
        <text
          x={X_TEXTO}
          y={completo ? 112 : 138}
          fontSize="118"
          fontWeight="800"
          textLength="440"
          lengthAdjust="spacingAndGlyphs"
        >
          SERVIS
        </text>
      </g>

      {completo ? (
        <g fontFamily={FUENTE_TITULOS} fontWeight="600" fontSize="25" fill={colorDescriptor}>
          <text x={X_TEXTO + 4} y={152} textLength="300" lengthAdjust="spacingAndGlyphs">
            SERVICIOS ACADÉMICOS
          </text>
          <text x={X_TEXTO + 4} y={184} textLength="512" lengthAdjust="spacingAndGlyphs">
            Y ADMINISTRATIVOS AUTOMATIZADOS
          </text>
        </g>
      ) : null}
    </svg>
  );
}
