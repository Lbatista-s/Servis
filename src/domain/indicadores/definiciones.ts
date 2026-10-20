/**
 * Cuadro de mando integral de SERVIS (Kaplan y Norton).
 *
 * La misión encabeza el mapa y las perspectivas siguen el orden que Kaplan y
 * Norton proponen para el sector público y las instituciones educativas: el
 * estudiante (cliente) arriba, la gestión de recursos (la perspectiva
 * financiera adaptada) a su lado, y debajo los procesos internos y el
 * aprendizaje que los sostienen. Cada objetivo tiene un indicador, una meta y
 * una iniciativa, y declara a qué objetivo contribuye (relación causa-efecto).
 *
 * La fundamentación y las fórmulas están en `docs/cuadro-de-mando.md`.
 */

export const MISION =
  'Tramitar los servicios académicos y administrativos del Área de Ingenierías de forma ágil, trazable y sin papel.';

export const PERSPECTIVAS = [
  {
    id: 'estudiante',
    nombre: 'Estudiante',
    pregunta: '¿Qué valor recibe el estudiante?',
  },
  {
    id: 'recursos',
    nombre: 'Recursos',
    pregunta: '¿Usamos bien los recursos del Área?',
  },
  {
    id: 'procesos',
    nombre: 'Procesos internos',
    pregunta: '¿En qué procesos debemos sobresalir?',
  },
  {
    id: 'aprendizaje',
    nombre: 'Aprendizaje y crecimiento',
    pregunta: '¿Qué capacidades sostienen la mejora?',
  },
] as const;

export type IdPerspectiva = (typeof PERSPECTIVAS)[number]['id'];

export const ID_INDICADORES = [
  'entregaATiempo',
  'tiempoCiclo',
  'resolucionPrimera',
  'productividad',
  'papelEvitado',
  'tiempoAtencion',
  'colaAlDia',
  'expedientesCompletos',
  'catalogoEnLinea',
  'equipoInvolucrado',
  'adopcion',
] as const;

export type IdIndicador = (typeof ID_INDICADORES)[number];

/** Metas vigentes, una por indicador. */
export type Metas = Record<IdIndicador, number>;

export type Sentido = 'mayor' | 'menor';

/**
 * `resultado`: indicador rezagado, mide lo logrado.
 * `inductor`: indicador adelantado, anticipa los resultados.
 */
export type TipoIndicador = 'resultado' | 'inductor';

export type Unidad = '%' | 'días' | 'solicitudes' | 'hojas';

export interface DefinicionIndicador {
  id: IdIndicador;
  perspectiva: IdPerspectiva;
  objetivo: string;
  nombre: string;
  descripcion: string;
  formula: string;
  unidad: Unidad;
  sentido: Sentido;
  tipo: TipoIndicador;
  iniciativa: string;
  /** Objetivos a los que este contribuye en el mapa estratégico. */
  contribuyeA: readonly IdIndicador[];
  metaPorDefecto: number;
  /**
   * `true` si se mide sobre la situación actual y no sobre el período, por lo
   * que no tiene tendencia ni serie histórica.
   */
  instantaneo?: boolean;
}

export const INDICADORES: readonly DefinicionIndicador[] = [
  // ── Estudiante ──────────────────────────────────────────────────────────
  {
    id: 'entregaATiempo',
    perspectiva: 'estudiante',
    objetivo: 'Entregar a tiempo',
    nombre: 'Cumplimiento del plazo',
    descripcion:
      'Porcentaje de solicitudes completadas dentro del tiempo estimado que el catálogo promete para su servicio.',
    formula:
      'Completadas en el período con (días hábiles de «enviada» a «completada») ≤ días estimados del servicio ÷ completadas en el período × 100',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'resultado',
    iniciativa: 'Alertas de vencimiento en la bandeja',
    contribuyeA: [],
    metaPorDefecto: 85,
  },
  {
    id: 'tiempoCiclo',
    perspectiva: 'estudiante',
    objetivo: 'Respuesta ágil',
    nombre: 'Tiempo medio de ciclo',
    descripcion:
      'Días hábiles que tarda, en promedio, una solicitud desde que se envía hasta que se resuelve.',
    formula:
      'Promedio de días hábiles de «enviada» a «completada» o «rechazada», sobre las resueltas en el período',
    unidad: 'días',
    sentido: 'menor',
    tipo: 'resultado',
    iniciativa: 'Plantillas de documento por servicio',
    contribuyeA: [],
    metaPorDefecto: 5,
  },
  {
    id: 'resolucionPrimera',
    perspectiva: 'estudiante',
    objetivo: 'Resolver a la primera',
    nombre: 'Resolución sin devoluciones',
    descripcion:
      'Porcentaje de solicitudes resueltas sin haber sido devueltas al estudiante para corregir.',
    formula:
      'Resueltas en el período que nunca pasaron por «devuelta» ÷ resueltas en el período × 100',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'resultado',
    iniciativa: 'Guía de requisitos en el formulario',
    contribuyeA: [],
    metaPorDefecto: 80,
  },
  // ── Recursos ────────────────────────────────────────────────────────────
  {
    id: 'productividad',
    perspectiva: 'recursos',
    objetivo: 'Productividad del equipo',
    nombre: 'Resoluciones por persona',
    descripcion:
      'Solicitudes resueltas por cada miembro activo del personal, normalizadas a 30 días para comparar períodos.',
    formula: 'Resueltas en el período ÷ personal activo ÷ (días del período ÷ 30)',
    unidad: 'solicitudes',
    sentido: 'mayor',
    tipo: 'resultado',
    iniciativa: 'Asignación equilibrada de la cola',
    contribuyeA: [],
    metaPorDefecto: 6,
  },
  {
    id: 'papelEvitado',
    perspectiva: 'recursos',
    objetivo: 'Trámite sin papel',
    nombre: 'Hojas de papel evitadas',
    descripcion:
      'Estimación de las hojas que habría consumido el trámite en papel, normalizada a 30 días. Supuesto: una hoja por formulario, una por documento adjunto y una por documento emitido.',
    formula:
      'Σ (1 + adjuntos + documento emitido) de las solicitudes enviadas en el período ÷ (días del período ÷ 30)',
    unidad: 'hojas',
    sentido: 'mayor',
    tipo: 'resultado',
    iniciativa: 'Documento de salida digital',
    contribuyeA: [],
    metaPorDefecto: 45,
  },
  // ── Procesos internos ───────────────────────────────────────────────────
  {
    id: 'tiempoAtencion',
    perspectiva: 'procesos',
    objetivo: 'Atender sin demora',
    nombre: 'Tiempo hasta la revisión',
    descripcion:
      'Días hábiles que espera, en promedio, una solicitud enviada hasta que alguien la toma en revisión.',
    formula:
      'Promedio de días hábiles de «enviada» a «en revisión», sobre las tomadas en el período',
    unidad: 'días',
    sentido: 'menor',
    tipo: 'inductor',
    iniciativa: 'Aviso de nuevas solicitudes al personal',
    contribuyeA: ['tiempoCiclo', 'productividad'],
    metaPorDefecto: 1,
  },
  {
    id: 'colaAlDia',
    perspectiva: 'procesos',
    objetivo: 'Cola al día',
    nombre: 'Solicitudes vencidas',
    descripcion:
      'Porcentaje de las solicitudes abiertas al cierre del período que ya superaron el tiempo estimado de su servicio.',
    formula:
      'Abiertas al cierre con (días hábiles desde «enviada») > días estimados ÷ abiertas al cierre × 100',
    unidad: '%',
    sentido: 'menor',
    tipo: 'inductor',
    iniciativa: 'Revisión diaria de solicitudes vencidas',
    contribuyeA: ['entregaATiempo'],
    metaPorDefecto: 10,
  },
  {
    id: 'expedientesCompletos',
    perspectiva: 'procesos',
    objetivo: 'Expedientes completos',
    nombre: 'Envíos con requisitos completos',
    descripcion:
      'Porcentaje de solicitudes que llegan con todos los documentos obligatorios de su servicio.',
    formula:
      'Enviadas en el período con adjuntos ≥ requisitos obligatorios ÷ enviadas en el período × 100',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'inductor',
    iniciativa: 'Validación de requisitos al enviar',
    contribuyeA: ['resolucionPrimera'],
    metaPorDefecto: 95,
  },
  // ── Aprendizaje y crecimiento ───────────────────────────────────────────
  {
    id: 'catalogoEnLinea',
    perspectiva: 'aprendizaje',
    objetivo: 'Catálogo digitalizado',
    nombre: 'Servicios disponibles en línea',
    descripcion:
      'Capital de información: porcentaje de los servicios del catálogo que ya se pueden solicitar por SERVIS.',
    formula: 'Servicios activos ÷ servicios del catálogo × 100 (situación actual)',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'inductor',
    iniciativa: 'Completar las fichas y requisitos del catálogo',
    contribuyeA: ['expedientesCompletos', 'adopcion'],
    metaPorDefecto: 100,
    instantaneo: true,
  },
  {
    id: 'equipoInvolucrado',
    perspectiva: 'aprendizaje',
    objetivo: 'Equipo involucrado',
    nombre: 'Personal que participa',
    descripcion:
      'Capital humano: porcentaje del personal activo que tramitó al menos una solicitud en el período.',
    formula:
      'Personal activo con intervenciones en el historial del período ÷ personal activo × 100',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'inductor',
    iniciativa: 'Capacitación del personal en SERVIS',
    contribuyeA: ['tiempoAtencion', 'colaAlDia'],
    metaPorDefecto: 80,
  },
  {
    id: 'adopcion',
    perspectiva: 'aprendizaje',
    objetivo: 'Adopción de la plataforma',
    nombre: 'Estudiantes que usan SERVIS',
    descripcion:
      'Capital organizacional: porcentaje de los estudiantes activos que crearon al menos una solicitud en el período.',
    formula:
      'Estudiantes activos con solicitudes creadas en el período ÷ estudiantes activos × 100',
    unidad: '%',
    sentido: 'mayor',
    tipo: 'inductor',
    iniciativa: 'Difusión de SERVIS en el Área de Ingenierías',
    contribuyeA: ['papelEvitado'],
    metaPorDefecto: 60,
  },
];

export const METAS_POR_DEFECTO: Metas = Object.fromEntries(
  INDICADORES.map((indicador) => [indicador.id, indicador.metaPorDefecto]),
) as Metas;

export function definicionDe(id: IdIndicador): DefinicionIndicador {
  const definicion = INDICADORES.find((indicador) => indicador.id === id);
  if (!definicion) throw new Error(`Indicador desconocido: ${id}`);
  return definicion;
}

/** Períodos de análisis, en días naturales hacia atrás desde hoy. */
export const PERIODOS = [
  { id: '30', etiqueta: 'Últimos 30 días', dias: 30 },
  { id: '90', etiqueta: 'Trimestre', dias: 90 },
  { id: '180', etiqueta: 'Semestre', dias: 180 },
] as const;

export type IdPeriodo = (typeof PERIODOS)[number]['id'];
