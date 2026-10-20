/**
 * Historial de demostración para el cuadro de mando.
 *
 * Las 8 solicitudes del prototipo no bastan para medir tendencias, así que se
 * añaden solicitudes ya cerradas repartidas en los seis meses anteriores al
 * sembrado. Igual que el sembrado principal, cada una se construye ejecutando
 * las transiciones reales de la máquina de estados, así que su historial es
 * coherente; y el generador usa una semilla fija, así que es reproducible.
 */

import { aplicarTransicion } from '@/domain/businessRules';
import { crearDocumento } from '@/domain/documentos';
import { sumarDiasHabiles } from '@/domain/indicadores/calendario';
import type { Actor, Adjunto, EstadoSolicitud, Servicio, Solicitud, Usuario } from '@/domain/types';
import { camposDe } from '@/features/requests/formularios';

import { SERVICIOS_DEMO, USUARIOS_DEMO } from './seed';

const CANTIDAD = 90;
const DIAS_HACIA_ATRAS = 180;
const DIA = 24 * 60 * 60 * 1000;

/** Generador pseudoaleatorio con semilla (mulberry32): mismo resultado siempre. */
function aleatorio(semilla: number): () => number {
  let estado = semilla >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const JUSTIFICACIONES_RECHAZO = [
  'La documentación presentada no acredita la condición de estudiante activo en el período.',
  'El servicio solicitado no aplica a la carrera ni al plan de estudios del solicitante.',
  'La solicitud se presentó fuera del plazo establecido por el calendario académico vigente.',
];

const MOTIVOS_DEVOLUCION = [
  'Falta adjuntar uno de los documentos obligatorios del servicio.',
  'El documento adjunto está ilegible; súbelo de nuevo en mejor calidad.',
  'Los datos del formulario no coinciden con los del documento adjunto.',
];

type Escenario = 'normal' | 'devolucion' | 'tarde' | 'rechazada' | 'cancelada';

function escenarioDe(r: number): Escenario {
  if (r < 0.6) return 'normal';
  if (r < 0.74) return 'devolucion';
  if (r < 0.84) return 'tarde';
  if (r < 0.94) return 'rechazada';
  return 'cancelada';
}

const actorDe = (usuario: Usuario): Actor => ({
  id: usuario.id,
  nombre: usuario.nombre,
  rol: usuario.rol,
});

/** Respuestas verosímiles para el formulario del servicio. */
function datosDe(servicio: Servicio, azar: () => number, creada: Date): Record<string, string> {
  const fecha = new Date(creada.getTime() + Math.floor(azar() * 30 + 7) * DIA)
    .toISOString()
    .slice(0, 10);
  return Object.fromEntries(
    camposDe(servicio.id).map((campo) => {
      if (campo.tipo === 'fecha') return [campo.nombre, fecha];
      if (campo.tipo === 'correo') return [campo.nombre, 'contacto@empresa.com.do'];
      if (campo.tipo === 'telefono') return [campo.nombre, '+1 (809) 555-0100'];
      if (campo.tipo === 'area')
        return [campo.nombre, `Solicitud de ${servicio.nombre.toLowerCase()}.`];
      return [campo.nombre, campo.obligatorio ? `${campo.etiqueta} registrado` : ''];
    }),
  );
}

/**
 * Construye el historial cerrado de los seis meses anteriores a `ahora`.
 * Identificadores `SRV-0901` en adelante, que no chocan con los del prototipo.
 */
export function construirHistorialDemo(ahora: Date, semilla = 2026): Solicitud[] {
  const azar = aleatorio(semilla);
  const elegir = <T>(lista: readonly T[]): T => lista[Math.floor(azar() * lista.length)] as T;
  const entre = (minimo: number, maximo: number) => minimo + azar() * (maximo - minimo);

  const estudiantes = USUARIOS_DEMO.filter((u) => u.rol === 'estudiante');
  const personal = USUARIOS_DEMO.filter((u) => u.rol === 'personal_administrativo' && u.activo);
  const revisores = USUARIOS_DEMO.filter(
    (u) => (u.rol === 'personal_administrativo' || u.rol === 'coordinador') && u.activo,
  );
  const servicios = SERVICIOS_DEMO.filter((s) => s.activo);

  const solicitudes: Solicitud[] = [];
  for (let indice = 0; indice < CANTIDAD; indice += 1) {
    const id = `SRV-${String(901 + indice).padStart(4, '0')}`;
    const servicio = elegir(servicios);
    const estudiante = actorDe(elegir(estudiantes));
    const tramitador = actorDe(elegir(personal));
    const escenario = escenarioDe(azar());

    // Hora laboral de un día hábil entre 12 y 180 días atrás.
    const base = new Date(ahora.getTime() - entre(12, DIAS_HACIA_ATRAS) * DIA);
    base.setUTCHours(12 + Math.floor(azar() * 8), Math.floor(azar() * 60), 0, 0);
    const creada = sumarDiasHabiles(base, 0);

    const obligatorios = servicio.requisitos.filter((r) => r.obligatorio).length;
    // Uno de cada ocho expedientes llega incompleto; casi siempre acaba devuelto.
    const incompleto = obligatorios > 0 && azar() < 0.125;
    const cantidadAdjuntos = incompleto ? obligatorios - 1 : obligatorios;
    const adjuntos: Adjunto[] = Array.from({ length: cantidadAdjuntos }, (_, n) => ({
      id: `${id}-adj${n + 1}`,
      nombre: `${servicio.requisitos[n]?.descripcion.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, '_') ?? 'documento'}.pdf`,
      tamano: Math.floor(entre(80_000, 900_000)),
      tipo: 'application/pdf',
      subidoEn: creada.toISOString(),
    }));

    let solicitud: Solicitud = {
      id,
      servicioId: servicio.id,
      solicitanteId: estudiante.id,
      estado: 'borrador',
      creadaEn: creada.toISOString(),
      actualizadaEn: creada.toISOString(),
      enviadaEn: null,
      datosFormulario: datosDe(servicio, azar, creada),
      adjuntos,
      historial: [
        Object.freeze({
          id: `${id}-h0`,
          solicitudId: id,
          autorId: estudiante.id,
          autorNombre: estudiante.nombre,
          fecha: creada.toISOString(),
          estadoAnterior: null,
          estadoNuevo: 'borrador' as EstadoSolicitud,
          comentario: null,
        }),
      ],
      comentarioInterno: '',
      asignadaA: null,
      prioridad: azar() < 0.15 ? 'alta' : 'normal',
      documento: null,
    };

    // Pasos: estado, actor y días hábiles de espera desde el paso anterior.
    // Las esperas son fracciones del plazo del servicio: en el escenario normal
    // suman entre un cuarto y tres cuartos del plazo; en el tardío lo superan.
    const plazo = servicio.diasEstimados;
    const lento = escenario === 'tarde' ? 2.2 : 1;
    const pasos: [EstadoSolicitud, Actor, number, string?][] = [
      ['enviada', estudiante, entre(0.01, 0.1)],
    ];
    if (escenario === 'cancelada') {
      pasos.push(['cancelada', tramitador, entre(0.3, 2)]);
    } else {
      pasos.push(['en_revision', tramitador, Math.min(entre(0.05, 0.2) * plazo, 1.5) * lento]);
      if (escenario === 'devolucion' || incompleto) {
        pasos.push([
          'devuelta',
          actorDe(elegir(revisores)),
          entre(0.2, 1),
          elegir(MOTIVOS_DEVOLUCION),
        ]);
        pasos.push(['corregida', estudiante, entre(0.5, 2.5)]);
        pasos.push(['en_revision', tramitador, entre(0.1, 0.8)]);
      }
      if (escenario === 'rechazada') {
        pasos.push([
          'rechazada',
          actorDe(elegir(revisores)),
          entre(0.3, 2),
          elegir(JUSTIFICACIONES_RECHAZO),
        ]);
      } else {
        pasos.push(['aprobada', actorDe(elegir(revisores)), entre(0.1, 0.3) * plazo * lento]);
        pasos.push(['completada', tramitador, entre(0.05, 0.2) * plazo * lento]);
      }
    }

    let fecha = creada;
    for (const [paso, [hacia, actor, espera, comentario]] of pasos.entries()) {
      fecha = sumarDiasHabiles(fecha, espera);
      const resultado = aplicarTransicion(solicitud, hacia, actor, {
        comentario,
        ahora: fecha,
        generarId: () => `${id}-h${paso + 1}`,
      });
      if (!resultado.ok) {
        throw new Error(`Historial de demostración inválido en ${id}: ${resultado.error.mensaje}`);
      }
      solicitud = resultado.valor;
      if (hacia === 'en_revision') solicitud = { ...solicitud, asignadaA: actor.id };
    }

    if (solicitud.estado === 'completada') {
      solicitud = { ...solicitud, documento: crearDocumento(id, servicio.nombre, fecha) };
    }

    // Sólo se conservan las ya cerradas: el historial no debe llenar la bandeja.
    if (fecha < ahora) solicitudes.push(solicitud);
  }
  return solicitudes;
}
