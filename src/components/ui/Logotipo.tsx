/**
 * Logotipo de SERVIS en vector, construido según el «Modelo de logos
 * auxiliares» del manual de identidad de INTEC:
 *
 * - el logo comercial de INTEC como base, con sus trazos oficiales (extraídos
 *   del PDF descargable del manual, sin alterar forma ni color);
 * - un icono único hexagonal, el símbolo S de SERVIS, un 125 % mayor que el
 *   hexágono del logo comercial y apoyado con uno de sus lados paralelo al
 *   lado superior derecho de éste;
 * - el nombre alineado a la derecha del logo comercial, en mayúsculas y Vino
 *   INTEC (Montserrat Black, equivalente libre de la Gotham Black del manual),
 *   con el texto descriptivo en Rojo INTEC debajo.
 *
 * Versiones: `color` para fondos claros y `negativo` para el marco gris, donde
 * el Vino no se lee: el nombre va en blanco y el descriptor en Rojo 30 %. El
 * logo comercial puede ir sobre cualquier fondo salvo Rojo o Vino sólidos, así
 * que ninguna de las dos lo coloca sobre esos colores.
 */

import { cn } from '@/lib/utils';
import { COLORES_MARCA } from '@/theme/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Geometría
// ─────────────────────────────────────────────────────────────────────────────

type Punto = readonly [number, number];

/** Hexágono de INTEC (vértice arriba): 133,4 × 154 unidades, como el archivo oficial. */
const ANCHO_INTEC = 133.4;
const ALTO_INTEC = 154.05;
/** Lado superior derecho del hexágono de INTEC, en su propio sistema. */
const LADO_SUPERIOR_DERECHO_INTEC: readonly [Punto, Punto] = [
  [ANCHO_INTEC / 2, 0],
  [ANCHO_INTEC, ALTO_INTEC / 4],
];

/** Contorno del símbolo S (`SimboloServis`), dibujado en una caja de 98 × 114 desde (1, 1). */
const ANCHO_SIMBOLO = 98;
/** Lado inferior izquierdo del símbolo, en el sistema de `SimboloServis`. */
const LADO_INFERIOR_IZQUIERDO_SIMBOLO: readonly [Punto, Punto] = [
  [1, 86.7],
  [50, 115],
];
/** Vértices del contorno del símbolo, en el sistema de `SimboloServis`. */
const CONTORNO_SIMBOLO: readonly Punto[] = [
  [50, 1],
  [99, 29.3],
  [99, 86.7],
  [50, 115],
  [1, 86.7],
  [1, 29.3],
];

/** El icono único mide el 125 % del hexágono del logo comercial. */
const ESCALA_SIMBOLO = (ANCHO_INTEC * 1.25) / ANCHO_SIMBOLO;
/** Separación entre los dos lados paralelos: sólo se tocan los filetes. */
const HOLGURA = 3;
/** Margen del lienzo, para que no se recorten filetes. */
const MARGEN = 3;
/** Distancia entre el logo comercial y el nombre. */
const SEPARACION_TEXTO = 26;

const NOMBRE = { tamano: 118, ancho: 440, altoMayuscula: 86 };
const DESCRIPTOR = { tamano: 25, anchos: [300, 512] as const, interlineado: 32 };

const punto = (a: Punto, b: Punto, t: number): Punto => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

/**
 * Posición de cada pieza del logotipo, en un sistema cuyo origen es la
 * esquina superior izquierda de la caja del hexágono de INTEC. Pura y
 * exportada para poder comprobar la regla del manual en las pruebas.
 */
export function geometriaLogotipo(formato: 'completo' | 'compacto') {
  // Normal exterior del lado superior derecho de INTEC (hacia arriba y a la derecha).
  const [a, b] = LADO_SUPERIOR_DERECHO_INTEC;
  const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const normal: Punto = [(b[1] - a[1]) / largo, -(b[0] - a[0]) / largo];
  const medioIntec = punto(a, b, 0.5);

  // El punto medio del lado inferior izquierdo del símbolo se coloca frente al
  // del lado de INTEC, a la distancia de la holgura.
  const aSimbolo = (p: Punto): Punto => [(p[0] - 1) * ESCALA_SIMBOLO, (p[1] - 1) * ESCALA_SIMBOLO];
  const [c, d] = LADO_INFERIOR_IZQUIERDO_SIMBOLO;
  const medioSimbolo = aSimbolo(punto(c, d, 0.5));
  const origenSimbolo: Punto = [
    medioIntec[0] + normal[0] * HOLGURA - medioSimbolo[0],
    medioIntec[1] + normal[1] * HOLGURA - medioSimbolo[1],
  ];
  const enLienzo = (p: Punto): Punto => {
    const q = aSimbolo(p);
    return [q[0] + origenSimbolo[0], q[1] + origenSimbolo[1]];
  };
  const contornoSimbolo = CONTORNO_SIMBOLO.map(enLienzo);
  const ladoSimbolo: readonly [Punto, Punto] = [enLienzo(c), enLienzo(d)];

  // El nombre, a la derecha del logo comercial y bajo el icono.
  const xTexto = ANCHO_INTEC + SEPARACION_TEXTO;
  const completo = formato === 'completo';
  const baseNombre = completo ? 128 : 136;
  const cajaNombre = {
    x: xTexto,
    y: baseNombre - NOMBRE.altoMayuscula,
    ancho: NOMBRE.ancho,
    alto: NOMBRE.altoMayuscula,
  };
  const basesDescriptor = completo
    ? [baseNombre + 34, baseNombre + 34 + DESCRIPTOR.interlineado]
    : [];

  const xs = [...contornoSimbolo.map((p) => p[0]), 0, xTexto + NOMBRE.ancho];
  if (completo) xs.push(xTexto + 4 + DESCRIPTOR.anchos[1] + 50);
  const ys = [
    ...contornoSimbolo.map((p) => p[1]),
    ALTO_INTEC,
    ...basesDescriptor.map((y) => y + 8),
  ];
  const minX = Math.min(...xs) - MARGEN;
  const minY = Math.min(...ys) - MARGEN;

  return {
    escala: ESCALA_SIMBOLO,
    ladoIntec: LADO_SUPERIOR_DERECHO_INTEC,
    ladoSimbolo,
    contornoSimbolo,
    origenSimbolo,
    cajaNombre,
    baseNombre,
    basesDescriptor,
    caja: {
      x: minX,
      y: minY,
      ancho: Math.max(...xs) + MARGEN - minX,
      alto: Math.max(...ys) + MARGEN - minY,
    },
  };
}

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
  const colorDescriptor = negativo ? COLORES_MARCA.rojo30 : COLORES_MARCA.rojoIntec;
  const g = geometriaLogotipo(formato);
  const { caja } = g;

  return (
    <svg
      viewBox={`${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`}
      height={alto}
      width={(alto * caja.ancho) / caja.alto}
      role="img"
      aria-label="SERVIS — Servicios académicos y administrativos automatizados, INTEC"
      className={cn('shrink-0', className)}
    >
      <HexagonoIntec y={0} />

      <g
        transform={`translate(${g.origenSimbolo[0]} ${g.origenSimbolo[1]}) scale(${g.escala}) translate(-1 -1)`}
      >
        <SimboloServis filete={negativo ? '#FFFFFF' : COLORES_MARCA.vino} />
      </g>

      <text
        x={g.cajaNombre.x}
        y={g.baseNombre}
        fontFamily={FUENTE_TITULOS}
        fontSize={NOMBRE.tamano}
        fontWeight="900"
        fill={colorNombre}
        textLength={NOMBRE.ancho}
        lengthAdjust="spacingAndGlyphs"
      >
        SERVIS
      </text>

      {g.basesDescriptor.length > 0 ? (
        <g
          fontFamily={FUENTE_TITULOS}
          fontWeight="700"
          fontSize={DESCRIPTOR.tamano}
          fill={colorDescriptor}
        >
          <text
            x={g.cajaNombre.x + 4}
            y={g.basesDescriptor[0]}
            textLength={DESCRIPTOR.anchos[0]}
            lengthAdjust="spacingAndGlyphs"
          >
            SERVICIOS ACADÉMICOS
          </text>
          <text
            x={g.cajaNombre.x + 4}
            y={g.basesDescriptor[1]}
            textLength={DESCRIPTOR.anchos[1]}
            lengthAdjust="spacingAndGlyphs"
          >
            Y ADMINISTRATIVOS AUTOMATIZADOS
          </text>
          {/* Filete que cierra el texto descriptivo, como en el modelo del manual. */}
          <line
            x1={g.cajaNombre.x + 4 + DESCRIPTOR.anchos[1] + 12}
            x2={g.cajaNombre.x + 4 + DESCRIPTOR.anchos[1] + 50}
            y1={(g.basesDescriptor[1] ?? 0) - 8}
            y2={(g.basesDescriptor[1] ?? 0) - 8}
            stroke={colorDescriptor}
            strokeWidth="2"
          />
        </g>
      ) : null}
    </svg>
  );
}
