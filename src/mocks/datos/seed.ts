/**
 * Datos de demostración del sistema, tomados del prototipo de alta fidelidad.
 *
 * Las solicitudes no se escriben a mano con su estado final: se construyen
 * ejecutando las transiciones reales sobre la máquina de estados. Así el
 * historial siempre es coherente y resulta imposible sembrar la base con una
 * solicitud que el propio dominio consideraría inválida.
 */

import { aplicarTransicion } from '@/domain/businessRules';
import { crearDocumento } from '@/domain/documentos';
import type {
  Actor,
  EstadoSolicitud,
  Requisito,
  Servicio,
  Solicitud,
  TipoDocumento,
  Usuario,
} from '@/domain/types';

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

export const USUARIOS_DEMO: readonly Usuario[] = [
  {
    id: 'usr-luis',
    nombre: 'Luis Batista',
    correo: 'l.batista@intec.edu.do',
    rol: 'estudiante',
    iniciales: 'LB',
    colorAvatar: 'blue',
    activo: true,
    matricula: '2021-0456',
    carrera: 'Ingeniería de Software',
    semestre: '8.° · 2026-1',
    ultimoAcceso: '2026-07-09T12:40:00.000Z',
  },
  {
    id: 'usr-adan',
    nombre: 'Adán León',
    correo: 'a.leon@intec.edu.do',
    rol: 'estudiante',
    iniciales: 'AL',
    colorAvatar: 'green',
    activo: true,
    matricula: '2021-0871',
    carrera: 'Ingeniería Industrial',
    semestre: '8.° · 2026-1',
    ultimoAcceso: '2026-07-08T16:05:00.000Z',
  },
  {
    id: 'usr-gerald',
    nombre: 'Gerald Jimeno',
    correo: 'g.jimeno@intec.edu.do',
    rol: 'estudiante',
    iniciales: 'GJ',
    colorAvatar: 'amber',
    activo: true,
    matricula: '2020-1134',
    carrera: 'Ingeniería Civil',
    semestre: '9.° · 2026-1',
    ultimoAcceso: '2026-07-07T09:12:00.000Z',
  },
  {
    id: 'usr-ana',
    nombre: 'Ana García',
    correo: 'a.garcia@intec.edu.do',
    rol: 'estudiante',
    iniciales: 'AG',
    colorAvatar: 'teal',
    activo: true,
    matricula: '2022-0219',
    carrera: 'Ingeniería de Sistemas',
    semestre: '6.° · 2026-1',
    ultimoAcceso: '2026-07-06T11:30:00.000Z',
  },
  {
    id: 'usr-miguel',
    nombre: 'Miguel Torres',
    correo: 'm.torres@intec.edu.do',
    rol: 'estudiante',
    iniciales: 'MT',
    colorAvatar: 'green',
    activo: false,
    matricula: '2019-0742',
    carrera: 'Ingeniería Mecánica',
    semestre: '10.° · 2026-1',
    ultimoAcceso: '2026-06-28T14:22:00.000Z',
  },
  {
    id: 'usr-ricardo',
    nombre: 'Ricardo Almanzar',
    correo: 'r.almanzar@intec.edu.do',
    rol: 'personal_administrativo',
    iniciales: 'RA',
    colorAvatar: 'purple',
    activo: true,
    ultimoAcceso: '2026-07-09T13:01:00.000Z',
  },
  {
    id: 'usr-carmen',
    nombre: 'Carmen Pérez',
    correo: 'c.perez@intec.edu.do',
    rol: 'personal_administrativo',
    iniciales: 'CP',
    colorAvatar: 'red',
    activo: true,
    ultimoAcceso: '2026-07-09T10:47:00.000Z',
  },
  {
    id: 'usr-axell',
    nombre: 'Axell Feliz',
    correo: 'a.feliz@intec.edu.do',
    rol: 'coordinador',
    iniciales: 'AF',
    colorAvatar: 'teal',
    activo: true,
    ultimoAcceso: '2026-07-09T08:15:00.000Z',
  },
  {
    id: 'usr-edwin',
    nombre: 'Edwin López',
    correo: 'e.lopez@intec.edu.do',
    rol: 'administrador',
    iniciales: 'EL',
    colorAvatar: 'blue',
    activo: true,
    ultimoAcceso: '2026-07-09T07:50:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de documentos que SERVIS puede pedir
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENTOS_DEMO: readonly TipoDocumento[] = [
  { id: 'documento-identidad', nombre: 'Documento de identidad' },
  { id: 'record-notas', nombre: 'Récord de notas' },
  { id: 'carta-aceptacion', nombre: 'Carta de aceptación de la empresa en papel membretado' },
  { id: 'datos-supervisor', nombre: 'Datos completos del supervisor inmediato' },
  { id: 'carta-motivacion', nombre: 'Carta de motivación dirigida al Área' },
  { id: 'no-deuda', nombre: 'Constancia de no deuda con Tesorería' },
  { id: 'carta-baja', nombre: 'Carta explicativa del período de baja' },
  { id: 'acta-nacimiento', nombre: 'Acta de nacimiento legalizada' },
  { id: 'pago-grado', nombre: 'Comprobante de pago de derechos de grado' },
  { id: 'fotografia', nombre: 'Fotografía tamaño 2x2 de fondo blanco' },
  { id: 'constancia-inscripcion', nombre: 'Constancia de inscripción vigente' },
  { id: 'comprobante-pago', nombre: 'Comprobante del pago realizado' },
  { id: 'justificacion-reembolso', nombre: 'Justificación escrita del reembolso' },
  { id: 'certificacion-bancaria', nombre: 'Certificación bancaria de la cuenta' },
  { id: 'inscripcion-familiares', nombre: 'Constancia de inscripción de ambos familiares' },
  { id: 'descripcion-objeto', nombre: 'Descripción detallada del objeto' },
  { id: 'evaluacion', nombre: 'Copia de la evaluación cuestionada' },
  { id: 'argumentacion', nombre: 'Argumentación escrita de la revisión' },
];

/** Requisito de un servicio a partir de un documento del catálogo. */
function pide(documentoId: string, obligatorio = true): Requisito {
  const documento = DOCUMENTOS_DEMO.find((d) => d.id === documentoId);
  if (!documento) throw new Error(`Documento desconocido en el catálogo: ${documentoId}`);
  return { id: documento.id, descripcion: documento.nombre, obligatorio };
}

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de servicios
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICIOS_DEMO: readonly Servicio[] = [
  {
    id: 'pasantia',
    nombre: 'Carta de pasantía',
    descripcion: 'Solicita tu carta oficial para iniciar una pasantía en empresa.',
    icono: '📄',
    color: '#FEF3C7',
    categoria: 'academico',
    plantilla: 'plantilla_pasantia_v1.docx',
    activo: true,
    diasEstimados: 3,
    requisitos: [pide('carta-aceptacion'), pide('datos-supervisor', false)],
  },
  {
    id: 'cambio',
    nombre: 'Cambio de carrera',
    descripcion: 'Tramita el cambio a una nueva carrera dentro del INTEC.',
    icono: '🔄',
    color: '#DBEAFE',
    categoria: 'academico',
    plantilla: 'plantilla_cambio_v1.docx',
    activo: true,
    diasEstimados: 7,
    requisitos: [pide('record-notas'), pide('carta-motivacion'), pide('no-deuda', false)],
  },
  {
    id: 'reingreso',
    nombre: 'Reingreso',
    descripcion: 'Solicita reintegrarte a tus estudios tras un período de baja.',
    icono: '↩️',
    color: '#DCFCE7',
    categoria: 'academico',
    plantilla: 'plantilla_reingreso_v1.docx',
    activo: true,
    diasEstimados: 5,
    requisitos: [pide('documento-identidad'), pide('carta-baja'), pide('no-deuda', false)],
  },
  {
    id: 'grado',
    nombre: 'Grado y posgrado',
    descripcion: 'Inicia el proceso formal de solicitud de grado o posgrado.',
    icono: '🎓',
    color: '#F3E8FF',
    categoria: 'academico',
    plantilla: 'plantilla_grado_v1.docx',
    activo: true,
    diasEstimados: 10,
    requisitos: [
      pide('record-notas'),
      pide('acta-nacimiento'),
      pide('pago-grado'),
      pide('fotografia', false),
    ],
  },
  {
    id: 'talleres',
    nombre: 'Talleres a la carta',
    descripcion: 'Inscríbete en talleres especializados ofrecidos por el Área.',
    icono: '🛠️',
    color: '#FEF3C7',
    categoria: 'academico',
    plantilla: 'plantilla_talleres_v1.docx',
    activo: true,
    diasEstimados: 2,
    requisitos: [pide('constancia-inscripcion')],
  },
  {
    id: 'reembolso',
    nombre: 'Solicitud de reembolso',
    descripcion: 'Solicita el reembolso de pagos realizados incorrectamente.',
    icono: '💰',
    color: '#DCFCE7',
    categoria: 'administrativo',
    plantilla: 'plantilla_reembolso_v1.docx',
    activo: true,
    diasEstimados: 8,
    requisitos: [
      pide('comprobante-pago'),
      pide('justificacion-reembolso'),
      pide('certificacion-bancaria', false),
    ],
  },
  {
    id: 'ingles',
    nombre: 'Prueba de nivel de inglés',
    descripcion: 'Programa tu evaluación de competencia en idioma inglés.',
    icono: '🗣️',
    color: '#DBEAFE',
    categoria: 'academico',
    plantilla: 'plantilla_ingles_v1.docx',
    activo: true,
    diasEstimados: 4,
    requisitos: [pide('documento-identidad')],
  },
  {
    id: 'descuento',
    nombre: 'Plan de descuento familiar',
    descripcion: 'Solicita la aplicación del descuento para familiares directos.',
    icono: '👨‍👩‍👧',
    color: '#FEF3E8',
    categoria: 'administrativo',
    plantilla: 'plantilla_descuento_v1.docx',
    activo: true,
    diasEstimados: 6,
    requisitos: [pide('acta-nacimiento'), pide('inscripcion-familiares')],
  },
  {
    id: 'carnet',
    nombre: 'Solicitud de carnet',
    descripcion: 'Obtén o repón tu carnet estudiantil institucional.',
    icono: '🪪',
    color: '#F0FDF4',
    categoria: 'identidad',
    plantilla: 'plantilla_carnet_v1.docx',
    activo: true,
    diasEstimados: 3,
    requisitos: [pide('fotografia'), pide('documento-identidad')],
  },
  {
    id: 'objetos',
    nombre: 'Objetos perdidos',
    descripcion: 'Reporta un objeto perdido o consulta el repositorio.',
    icono: '🔍',
    color: '#FFF1F2',
    categoria: 'identidad',
    plantilla: 'plantilla_objetos_v1.docx',
    activo: false,
    diasEstimados: 1,
    requisitos: [pide('descripcion-objeto')],
  },
  {
    id: 'resultados',
    nombre: 'Revisión de resultados',
    descripcion: 'Solicita la revisión formal de tus resultados de prueba.',
    icono: '📊',
    color: '#DBEAFE',
    categoria: 'academico',
    plantilla: 'plantilla_resultados_v1.docx',
    activo: false,
    diasEstimados: 5,
    requisitos: [pide('evaluacion'), pide('argumentacion')],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAL: Actor = {
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
};

const JUSTIFICACION_RECHAZO =
  'La documentación adjunta no corresponde al período académico vigente y no acredita ' +
  'la condición de estudiante activo requerida para este servicio.';

const MOTIVO_DEVOLUCION =
  'El récord de notas adjunto está incompleto: falta el último trimestre cursado. ' +
  'Adjunta el documento actualizado para continuar el trámite.';

/** Camino de estados que recorre cada solicitud hasta su estado de demostración. */
const CAMINOS: Record<EstadoSolicitud, readonly EstadoSolicitud[]> = {
  borrador: [],
  enviada: ['enviada'],
  en_revision: ['enviada', 'en_revision'],
  devuelta: ['enviada', 'en_revision', 'devuelta'],
  corregida: ['enviada', 'en_revision', 'devuelta', 'corregida'],
  aprobada: ['enviada', 'en_revision', 'aprobada'],
  rechazada: ['enviada', 'en_revision', 'rechazada'],
  completada: ['enviada', 'en_revision', 'aprobada', 'completada'],
  cancelada: ['cancelada'],
};

interface PlantillaSolicitud {
  id: string;
  servicioId: string;
  solicitanteId: string;
  /** Fecha de creación, en formato ISO. */
  creadaEn: string;
  estadoFinal: EstadoSolicitud;
  datosFormulario: Record<string, string>;
  comentarioInterno?: string;
}

const PLANTILLAS: readonly PlantillaSolicitud[] = [
  {
    id: 'SRV-1042',
    servicioId: 'pasantia',
    solicitanteId: 'usr-luis',
    creadaEn: '2026-07-02T13:14:00.000Z',
    estadoFinal: 'en_revision',
    datosFormulario: {
      empresa: 'TechCorp Solutions S.R.L.',
      rnc: '1-02-15671-3',
      cargo: 'Pasante de desarrollo de software',
      departamento: 'Ingeniería y Sistemas',
      fechaInicio: '2026-07-14',
      fechaFin: '2027-01-14',
      supervisorNombre: 'Ing. Jorge Martínez',
      supervisorCorreo: 'j.martinez@techcorp.com.do',
      supervisorTelefono: '+1 (809) 555-0123',
      supervisorCargo: 'Gerente de Ingeniería',
    },
    comentarioInterno:
      'Carta de aceptación verificada. Datos del supervisor confirmados. Pendiente de ' +
      'revisión del coordinador para aprobación.',
  },
  {
    id: 'SRV-1041',
    servicioId: 'grado',
    solicitanteId: 'usr-adan',
    creadaEn: '2026-07-01T14:30:00.000Z',
    estadoFinal: 'aprobada',
    datosFormulario: { modalidad: 'Grado', periodo: '2026-1', creditosAprobados: '198' },
  },
  {
    id: 'SRV-1040',
    servicioId: 'cambio',
    solicitanteId: 'usr-gerald',
    creadaEn: '2026-06-30T15:05:00.000Z',
    estadoFinal: 'devuelta',
    datosFormulario: {
      carreraActual: 'Ingeniería Civil',
      carreraDestino: 'Ingeniería Industrial',
      motivo: 'Mayor afinidad con el perfil de gestión de operaciones.',
    },
  },
  {
    id: 'SRV-1039',
    servicioId: 'objetos',
    solicitanteId: 'usr-ana',
    creadaEn: '2026-06-29T13:20:00.000Z',
    estadoFinal: 'completada',
    datosFormulario: {
      objeto: 'Calculadora científica Casio fx-991',
      lugar: 'Edificio de Ingenierías, aula 305',
      fecha: '2026-06-28',
    },
  },
  {
    id: 'SRV-1038',
    servicioId: 'talleres',
    solicitanteId: 'usr-miguel',
    creadaEn: '2026-06-28T16:45:00.000Z',
    estadoFinal: 'enviada',
    datosFormulario: { taller: 'Automatización industrial con PLC', turno: 'Sabatino' },
  },
  {
    id: 'SRV-1037',
    servicioId: 'reingreso',
    solicitanteId: 'usr-luis',
    creadaEn: '2026-06-27T12:10:00.000Z',
    estadoFinal: 'en_revision',
    datosFormulario: {
      periodoBaja: '2025-3',
      periodoReingreso: '2026-2',
      motivo: 'Interrupción por motivos laborales, ya resueltos.',
    },
  },
  {
    id: 'SRV-1036',
    servicioId: 'ingles',
    solicitanteId: 'usr-miguel',
    creadaEn: '2026-06-26T14:00:00.000Z',
    estadoFinal: 'rechazada',
    datosFormulario: { nivelDeclarado: 'Intermedio', fechaPreferida: '2026-07-15' },
  },
  {
    id: 'SRV-1035',
    servicioId: 'carnet',
    solicitanteId: 'usr-ana',
    creadaEn: '2026-06-25T13:35:00.000Z',
    estadoFinal: 'completada',
    datosFormulario: { motivo: 'Reposición por pérdida', tipoSangre: 'O+' },
  },
];

/** Adjunto de ejemplo, coherente con el documento mostrado en el prototipo. */
function adjuntoDemo(indice: number, creadaEn: string) {
  return {
    id: `adj-${indice}`,
    nombre: 'carta_aceptacion_empresa.pdf',
    tamano: 350_208,
    tipo: 'application/pdf',
    subidoEn: creadaEn,
  };
}

/** Comentario asociado a una transición concreta durante el sembrado. */
function comentarioDe(hacia: EstadoSolicitud): string | undefined {
  if (hacia === 'rechazada') return JUSTIFICACION_RECHAZO;
  if (hacia === 'devuelta') return MOTIVO_DEVOLUCION;
  if (hacia === 'en_revision') return 'Verificando la documentación adjunta.';
  return undefined;
}

function actorDe(hacia: EstadoSolicitud, solicitante: Actor): Actor {
  // Las transiciones hacia `enviada`, `corregida` y `cancelada` las ejecuta el
  // estudiante; el resto corresponde al personal administrativo.
  return hacia === 'enviada' || hacia === 'corregida' ? solicitante : PERSONAL;
}

/**
 * Construye las solicitudes de demostración recorriendo la máquina de estados.
 * Cada paso avanza cuatro horas para que el historial tenga fechas creíbles.
 */
export function construirSolicitudesDemo(): Solicitud[] {
  return PLANTILLAS.map((plantilla, indice) => {
    const usuario = USUARIOS_DEMO.find((u) => u.id === plantilla.solicitanteId);
    if (!usuario) {
      throw new Error(`Solicitante desconocido en los datos simulados: ${plantilla.solicitanteId}`);
    }
    const solicitante: Actor = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };

    let solicitud: Solicitud = {
      id: plantilla.id,
      servicioId: plantilla.servicioId,
      solicitanteId: plantilla.solicitanteId,
      estado: 'borrador',
      creadaEn: plantilla.creadaEn,
      actualizadaEn: plantilla.creadaEn,
      enviadaEn: null,
      datosFormulario: plantilla.datosFormulario,
      adjuntos: [adjuntoDemo(indice + 1, plantilla.creadaEn)],
      historial: [
        Object.freeze({
          id: `${plantilla.id}-h0`,
          solicitudId: plantilla.id,
          autorId: solicitante.id,
          autorNombre: solicitante.nombre,
          fecha: plantilla.creadaEn,
          estadoAnterior: null,
          estadoNuevo: 'borrador' as EstadoSolicitud,
          comentario: null,
        }),
      ],
      comentarioInterno: plantilla.comentarioInterno ?? '',
      asignadaA: null,
      prioridad:
        plantilla.estadoFinal === 'devuelta' || plantilla.estadoFinal === 'en_revision'
          ? 'alta'
          : 'normal',
      documento: null,
    };

    let paso = 0;
    for (const hacia of CAMINOS[plantilla.estadoFinal]) {
      paso += 1;
      const ahora = new Date(new Date(plantilla.creadaEn).getTime() + paso * 4 * 60 * 60 * 1000);
      const actor = actorDe(hacia, solicitante);
      const resultado = aplicarTransicion(solicitud, hacia, actor, {
        comentario: comentarioDe(hacia),
        ahora,
        generarId: () => `${plantilla.id}-h${paso}`,
      });

      // Si el sembrado produjera una transición inválida es un error de
      // programación, no un caso recuperable: conviene que falle de inmediato.
      if (!resultado.ok) {
        throw new Error(
          `Datos de demostración inválidos en ${plantilla.id}: ${resultado.error.mensaje}`,
        );
      }
      solicitud = resultado.valor;

      // La solicitud queda asignada a quien la tomó en revisión.
      if (hacia === 'en_revision') solicitud = { ...solicitud, asignadaA: actor.id };
    }

    if (solicitud.estado === 'completada') {
      const servicio = SERVICIOS_DEMO.find((s) => s.id === solicitud.servicioId);
      solicitud = {
        ...solicitud,
        documento: crearDocumento(
          solicitud.id,
          servicio?.nombre ?? solicitud.servicioId,
          new Date(solicitud.actualizadaEn),
        ),
      };
    }

    return solicitud;
  });
}
