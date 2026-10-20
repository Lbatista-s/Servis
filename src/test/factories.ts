/**
 * Fábricas de entidades para las pruebas. Permiten construir un objeto válido
 * con una sola línea y sobrescribir sólo el campo relevante para cada caso.
 */

import type {
  Actor,
  EntradaHistorial,
  EstadoSolicitud,
  Servicio,
  Solicitud,
  Usuario,
} from '@/domain/types';

const FECHA_BASE = '2026-07-02T13:14:00.000Z';

export function crearActor(parcial: Partial<Actor> = {}): Actor {
  return {
    id: 'usr-luis',
    nombre: 'Luis Batista',
    rol: 'estudiante',
    ...parcial,
  };
}

export function crearEntradaHistorial(parcial: Partial<EntradaHistorial> = {}): EntradaHistorial {
  return {
    id: 'hist-1',
    solicitudId: 'SRV-1042',
    autorId: 'usr-luis',
    autorNombre: 'Luis Batista',
    fecha: FECHA_BASE,
    estadoAnterior: null,
    estadoNuevo: 'borrador',
    comentario: null,
    ...parcial,
  };
}

export function crearSolicitud(parcial: Partial<Solicitud> = {}): Solicitud {
  const estado: EstadoSolicitud = parcial.estado ?? 'borrador';
  return {
    id: 'SRV-1042',
    servicioId: 'pasantia',
    solicitanteId: 'usr-luis',
    estado,
    creadaEn: FECHA_BASE,
    actualizadaEn: FECHA_BASE,
    enviadaEn: null,
    datosFormulario: { empresa: 'TechCorp Solutions S.R.L.' },
    adjuntos: [],
    historial: [crearEntradaHistorial()],
    comentarioInterno: '',
    asignadaA: null,
    prioridad: 'normal',
    documento: null,
    ...parcial,
  };
}

/**
 * Solicitud que ya pasó por `en_revision`, con el historial coherente. Se usa
 * en las pruebas de aprobación, rechazo y devolución.
 */
export function crearSolicitudEnRevision(parcial: Partial<Solicitud> = {}): Solicitud {
  return crearSolicitud({
    estado: 'en_revision',
    enviadaEn: FECHA_BASE,
    historial: [
      crearEntradaHistorial({ id: 'h1', estadoNuevo: 'borrador' }),
      crearEntradaHistorial({ id: 'h2', estadoAnterior: 'borrador', estadoNuevo: 'enviada' }),
      crearEntradaHistorial({ id: 'h3', estadoAnterior: 'enviada', estadoNuevo: 'en_revision' }),
    ],
    ...parcial,
  });
}

export function crearServicio(parcial: Partial<Servicio> = {}): Servicio {
  return {
    id: 'pasantia',
    nombre: 'Carta de pasantía',
    descripcion: 'Solicita tu carta oficial para iniciar una pasantía en empresa.',
    icono: '📄',
    color: '#FEF3C7',
    categoria: 'academico',
    requisitos: [
      {
        id: 'pasantia-r1',
        descripcion: 'Carta de aceptación de la empresa en papel membretado',
        obligatorio: true,
      },
      {
        id: 'pasantia-r2',
        descripcion: 'Datos completos del supervisor inmediato',
        obligatorio: false,
      },
    ],
    plantilla: 'plantilla_pasantia_v1.docx',
    activo: true,
    diasEstimados: 3,
    ...parcial,
  };
}

export function crearUsuario(parcial: Partial<Usuario> = {}): Usuario {
  return {
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
    ultimoAcceso: FECHA_BASE,
    ...parcial,
  };
}
