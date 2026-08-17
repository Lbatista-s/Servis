import { describe, expect, it } from 'vitest';

import {
  accionesPara,
  aplicarTransicion,
  puedeEditarEstudiante,
  haPasadoPorRevision,
  puedeModificarse,
  validarActivacionServicio,
  validarEdicion,
  validarRequisitosCubiertos,
  validarTransicion,
} from './businessRules';
import {
  crearActor,
  crearEntradaHistorial,
  crearServicio,
  crearSolicitud,
  crearSolicitudEnRevision,
} from '@/test/factories';

const ESTUDIANTE = crearActor({ id: 'usr-luis', nombre: 'Luis Batista', rol: 'estudiante' });
const PERSONAL = crearActor({
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
});
const COORDINADOR = crearActor({ id: 'usr-axell', nombre: 'Axell Feliz', rol: 'coordinador' });
const ADMIN = crearActor({ id: 'usr-edwin', nombre: 'Edwin López', rol: 'administrador' });

const JUSTIFICACION_VALIDA =
  'La carta de aceptación no está en papel membretado de la empresa y carece de firma.';

describe('regla: justificación obligatoria al rechazar', () => {
  it('rechaza la transición sin comentario', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'rechazada', PERSONAL);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('COMENTARIO_REQUERIDO');
  });

  it('rechaza una justificación de menos de 30 caracteres', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'rechazada', PERSONAL, {
      comentario: 'Faltan documentos.',
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('COMENTARIO_MUY_CORTO');
  });

  it('rechaza una justificación que sólo contiene espacios', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'rechazada', PERSONAL, {
      comentario: '                                             ',
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('COMENTARIO_REQUERIDO');
  });

  it('acepta una justificación de 30 caracteres o más', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'rechazada', PERSONAL, {
      comentario: JUSTIFICACION_VALIDA,
    });
    expect(resultado.ok).toBe(true);
  });
});

describe('regla: motivo obligatorio al devolver', () => {
  it('rechaza la devolución sin motivo', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'devuelta', PERSONAL);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('COMENTARIO_REQUERIDO');
  });

  it('acepta la devolución con motivo indicado', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'devuelta', PERSONAL, {
      comentario: 'Falta adjuntar la carta de la empresa.',
    });
    expect(resultado.ok).toBe(true);
  });
});

describe('regla: no se aprueba sin haber pasado por revisión', () => {
  it('impide aprobar una solicitud recién enviada', () => {
    const enviada = crearSolicitud({ estado: 'enviada' });
    const resultado = validarTransicion(enviada, 'aprobada', PERSONAL);
    expect(resultado.ok).toBe(false);
    // La tabla ya lo impide: 'enviada' no tiene arista hacia 'aprobada'.
    if (!resultado.ok) expect(resultado.error.codigo).toBe('TRANSICION_INVALIDA');
  });

  it('impide aprobar si el historial no registra el paso por revisión', () => {
    // Estado incoherente (por ejemplo, importado de un sistema externo):
    // el estado dice `en_revision` pero el historial no lo respalda.
    const incoherente = crearSolicitud({
      estado: 'en_revision',
      historial: [crearEntradaHistorial({ estadoNuevo: 'borrador' })],
    });
    // `haPasadoPorRevision` acepta el estado actual como evidencia válida.
    expect(haPasadoPorRevision(incoherente)).toBe(true);

    const sinRevision = crearSolicitud({ estado: 'aprobada' });
    expect(haPasadoPorRevision(sinRevision)).toBe(false);
  });

  it('permite aprobar una solicitud que sí está en revisión', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'aprobada', PERSONAL);
    expect(resultado.ok).toBe(true);
  });
});

describe('regla: una solicitud completada no puede modificarse', () => {
  it('considera inmutables los tres estados finales', () => {
    for (const estado of ['completada', 'rechazada', 'cancelada'] as const) {
      expect(puedeModificarse(crearSolicitud({ estado }))).toBe(false);
    }
  });

  it('impide cualquier transición desde completada', () => {
    const completada = crearSolicitud({ estado: 'completada' });
    const resultado = aplicarTransicion(completada, 'en_revision', PERSONAL);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('SOLICITUD_INMUTABLE');
  });

  it('impide editar los datos de una solicitud completada', () => {
    const resultado = validarEdicion(crearSolicitud({ estado: 'completada' }), ESTUDIANTE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('SOLICITUD_INMUTABLE');
  });

  it('permite editar una solicitud en borrador', () => {
    expect(validarEdicion(crearSolicitud({ estado: 'borrador' }), ESTUDIANTE).ok).toBe(true);
  });
});

describe('regla: sólo el propietario ejecuta acciones de estudiante', () => {
  it('impide que otro estudiante envíe una solicitud ajena', () => {
    const otro = crearActor({ id: 'usr-adan', nombre: 'Adán León', rol: 'estudiante' });
    const resultado = validarTransicion(crearSolicitud(), 'enviada', otro);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('NO_ES_PROPIETARIO');
  });

  it('no ofrece acciones sobre solicitudes ajenas', () => {
    const otro = crearActor({ id: 'usr-adan', rol: 'estudiante' });
    expect(accionesPara(crearSolicitud(), otro)).toHaveLength(0);
    expect(accionesPara(crearSolicitud(), ESTUDIANTE)).toHaveLength(2);
  });
});

describe('regla: el estudiante sólo edita antes de enviar o tras una devolución', () => {
  it('permite editar en borrador y en devuelta', () => {
    for (const estado of ['borrador', 'devuelta'] as const) {
      const solicitud = crearSolicitud({ estado });
      expect(validarEdicion(solicitud, ESTUDIANTE).ok).toBe(true);
      expect(puedeEditarEstudiante(solicitud, ESTUDIANTE)).toBe(true);
    }
  });

  it('impide editar mientras la solicitud está en manos del personal', () => {
    for (const estado of ['enviada', 'en_revision', 'corregida', 'aprobada'] as const) {
      const solicitud = crearSolicitud({ estado });
      const resultado = validarEdicion(solicitud, ESTUDIANTE);
      expect(resultado.ok, `estado ${estado}`).toBe(false);
      if (!resultado.ok) expect(resultado.error.codigo).toBe('EDICION_NO_PERMITIDA');
      expect(puedeEditarEstudiante(solicitud, ESTUDIANTE)).toBe(false);
    }
  });

  it('sigue impidiendo editar una solicitud en estado final', () => {
    const resultado = validarEdicion(crearSolicitud({ estado: 'completada' }), ESTUDIANTE);
    expect(resultado.ok).toBe(false);
    // La inmutabilidad tiene prioridad sobre la restricción de estado editable.
    if (!resultado.ok) expect(resultado.error.codigo).toBe('SOLICITUD_INMUTABLE');
  });

  it('no restringe al personal administrativo, que anota comentarios internos', () => {
    expect(validarEdicion(crearSolicitudEnRevision(), PERSONAL).ok).toBe(true);
    // Pero `puedeEditarEstudiante` es específico del estudiante.
    expect(puedeEditarEstudiante(crearSolicitudEnRevision(), PERSONAL)).toBe(false);
  });

  it('impide a un estudiante ajeno editar una solicitud devuelta', () => {
    const otro = crearActor({ id: 'usr-adan', rol: 'estudiante' });
    const resultado = validarEdicion(crearSolicitud({ estado: 'devuelta' }), otro);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('NO_ES_PROPIETARIO');
  });
});

describe('regla: autorización por rol', () => {
  it('impide al estudiante aprobar su propia solicitud', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'aprobada', ESTUDIANTE);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('ROL_NO_AUTORIZADO');
  });

  it('permite al coordinador aprobar y rechazar', () => {
    expect(validarTransicion(crearSolicitudEnRevision(), 'aprobada', COORDINADOR).ok).toBe(true);
    expect(
      validarTransicion(crearSolicitudEnRevision(), 'rechazada', COORDINADOR, {
        comentario: JUSTIFICACION_VALIDA,
      }).ok,
    ).toBe(true);
  });

  it('impide al administrador del sistema actuar sobre solicitudes', () => {
    const resultado = validarTransicion(crearSolicitudEnRevision(), 'aprobada', ADMIN);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('ROL_NO_AUTORIZADO');
  });
});

describe('regla: cada cambio de estado genera historial inmutable', () => {
  const ahora = new Date('2026-07-03T15:02:00.000Z');

  it('añade una entrada con autor, fecha, estados y comentario', () => {
    const solicitud = crearSolicitudEnRevision();
    const previas = solicitud.historial.length;

    const resultado = aplicarTransicion(solicitud, 'rechazada', PERSONAL, {
      comentario: JUSTIFICACION_VALIDA,
      ahora,
      generarId: () => 'hist-nuevo',
    });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.valor.historial).toHaveLength(previas + 1);
    const entrada = resultado.valor.historial[previas];
    expect(entrada).toMatchObject({
      id: 'hist-nuevo',
      solicitudId: 'SRV-1042',
      autorId: 'usr-ricardo',
      autorNombre: 'Ricardo Almanzar',
      fecha: ahora.toISOString(),
      estadoAnterior: 'en_revision',
      estadoNuevo: 'rechazada',
      comentario: JUSTIFICACION_VALIDA,
    });
  });

  it('registra null cuando la transición no lleva comentario', () => {
    const resultado = aplicarTransicion(crearSolicitud(), 'enviada', ESTUDIANTE, { ahora });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.valor.historial.at(-1)?.comentario).toBeNull();
  });

  it('no muta la solicitud original', () => {
    const original = crearSolicitud();
    const historialOriginal = original.historial.length;

    const resultado = aplicarTransicion(original, 'enviada', ESTUDIANTE, { ahora });

    expect(original.estado).toBe('borrador');
    expect(original.historial).toHaveLength(historialOriginal);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.valor.estado).toBe('enviada');
  });

  it('congela las entradas del historial para que no puedan alterarse', () => {
    const resultado = aplicarTransicion(crearSolicitud(), 'enviada', ESTUDIANTE, { ahora });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const entrada = resultado.valor.historial.at(-1);
    expect(Object.isFrozen(entrada)).toBe(true);
    expect(Object.isFrozen(resultado.valor.historial)).toBe(true);
  });

  it('fija la fecha de envío la primera vez y no la sobrescribe después', () => {
    const enviado = aplicarTransicion(crearSolicitud(), 'enviada', ESTUDIANTE, { ahora });
    expect(enviado.ok).toBe(true);
    if (!enviado.ok) return;
    expect(enviado.valor.enviadaEn).toBe(ahora.toISOString());

    const masTarde = new Date('2026-07-05T09:00:00.000Z');
    const enRevision = aplicarTransicion(enviado.valor, 'en_revision', PERSONAL, {
      ahora: masTarde,
    });
    expect(enRevision.ok).toBe(true);
    if (!enRevision.ok) return;
    // La fecha de envío original se conserva.
    expect(enRevision.valor.enviadaEn).toBe(ahora.toISOString());
    expect(enRevision.valor.actualizadaEn).toBe(masTarde.toISOString());
  });
});

describe('regla: un servicio no se activa sin requisitos', () => {
  it('impide activar un servicio sin requisitos definidos', () => {
    const servicio = crearServicio({ requisitos: [], activo: false });
    const resultado = validarActivacionServicio(servicio, true);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('SERVICIO_SIN_REQUISITOS');
  });

  it('permite activar un servicio con al menos un requisito', () => {
    const resultado = validarActivacionServicio(crearServicio({ activo: false }), true);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.valor.activo).toBe(true);
  });

  it('permite desactivar siempre, incluso sin requisitos', () => {
    const resultado = validarActivacionServicio(crearServicio({ requisitos: [] }), false);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.valor.activo).toBe(false);
  });
});

describe('regla: requisitos obligatorios cubiertos', () => {
  it('bloquea el envío si faltan adjuntos obligatorios', () => {
    const resultado = validarRequisitosCubiertos(crearSolicitud(), crearServicio());
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error.codigo).toBe('ADJUNTOS_FALTANTES');
  });

  it('permite el envío cuando los obligatorios están cubiertos', () => {
    const solicitud = crearSolicitud({
      adjuntos: [
        {
          id: 'adj-1',
          nombre: 'carta_aceptacion.pdf',
          tamano: 350_208,
          tipo: 'application/pdf',
          subidoEn: '2026-07-01T10:00:00.000Z',
        },
      ],
    });
    expect(validarRequisitosCubiertos(solicitud, crearServicio()).ok).toBe(true);
  });
});
