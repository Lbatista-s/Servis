/**
 * Pruebas de integración del ciclo de vida completo de una solicitud.
 *
 * Recorren dominio y persistencia juntos: crear → enviar → revisar → aprobar →
 * completar, comprobando que el historial queda íntegro y que los atajos
 * inválidos se rechazan en cada punto del camino.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { crearRepositorios } from '@/data';
import type { Repositorios } from '@/data/repositories/types';
import { restablecerAlmacen } from '@/data/repositories/localStorage';
import type { Actor, EstadoSolicitud } from '@/domain/types';

const ESTUDIANTE: Actor = { id: 'usr-luis', nombre: 'Luis Batista', rol: 'estudiante' };
const OTRO_ESTUDIANTE: Actor = { id: 'usr-adan', nombre: 'Adán León', rol: 'estudiante' };
const PERSONAL: Actor = {
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
};
const COORDINADOR: Actor = { id: 'usr-axell', nombre: 'Axell Feliz', rol: 'coordinador' };
const ADMIN: Actor = { id: 'usr-edwin', nombre: 'Edwin López', rol: 'administrador' };

const JUSTIFICACION =
  'La carta de aceptación no está en papel membretado de la empresa y carece de la firma ' +
  'del responsable de recursos humanos.';

let repos: Repositorios;

/** Crea un borrador de carta de pasantía para el estudiante. */
async function crearBorrador() {
  return repos.solicitudes.crear(
    {
      servicioId: 'pasantia',
      solicitanteId: ESTUDIANTE.id,
      datosFormulario: { empresa: 'TechCorp Solutions S.R.L.', cargo: 'Pasante de desarrollo' },
      adjuntos: [
        {
          id: 'adj-nuevo',
          nombre: 'carta_aceptacion.pdf',
          tamano: 350_208,
          tipo: 'application/pdf',
          subidoEn: new Date().toISOString(),
        },
      ],
    },
    ESTUDIANTE,
  );
}

beforeEach(() => {
  localStorage.clear();
  restablecerAlmacen();
  repos = crearRepositorios('local');
});

describe('flujo crítico: crear → enviar → revisar → aprobar → completar', () => {
  it('recorre el ciclo completo y deja el historial íntegro', async () => {
    // 1. Crear
    const borrador = await crearBorrador();
    expect(borrador.estado).toBe('borrador');
    expect(borrador.enviadaEn).toBeNull();

    // 2. Enviar (estudiante)
    const enviada = await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    expect(enviada.estado).toBe('enviada');
    expect(enviada.enviadaEn).not.toBeNull();

    // 3. Tomar en revisión (personal administrativo)
    const enRevision = await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);
    expect(enRevision.estado).toBe('en_revision');
    expect(enRevision.asignadaA).toBe(PERSONAL.id);

    // 4. Aprobar
    const aprobada = await repos.solicitudes.transicionar(borrador.id, 'aprobada', PERSONAL);
    expect(aprobada.estado).toBe('aprobada');

    // 5. Completar
    const completada = await repos.solicitudes.transicionar(borrador.id, 'completada', PERSONAL);
    expect(completada.estado).toBe('completada');

    // El historial refleja el camino exacto, sin huecos.
    const recorrido = completada.historial.map((entrada) => entrada.estadoNuevo);
    expect(recorrido).toEqual<EstadoSolicitud[]>([
      'borrador',
      'enviada',
      'en_revision',
      'aprobada',
      'completada',
    ]);

    // Cada entrada enlaza con la anterior y registra a su autor.
    for (let i = 1; i < completada.historial.length; i += 1) {
      expect(completada.historial[i]?.estadoAnterior).toBe(
        completada.historial[i - 1]?.estadoNuevo,
      );
      expect(completada.historial[i]?.autorNombre).toBeTruthy();
    }

    // Y el cambio quedó persistido, no sólo en el objeto devuelto.
    const releida = await repos.solicitudes.obtener(borrador.id);
    expect(releida?.estado).toBe('completada');
  });

  it('impide saltarse la revisión para aprobar directamente', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);

    await expect(
      repos.solicitudes.transicionar(borrador.id, 'aprobada', PERSONAL),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    const sinCambios = await repos.solicitudes.obtener(borrador.id);
    expect(sinCambios?.estado).toBe('enviada');
  });

  it('congela la solicitud una vez completada', async () => {
    const borrador = await crearBorrador();
    for (const destino of ['enviada', 'en_revision', 'aprobada', 'completada'] as const) {
      const actor = destino === 'enviada' ? ESTUDIANTE : PERSONAL;
      await repos.solicitudes.transicionar(borrador.id, destino, actor);
    }

    // Ni transiciones ni ediciones de contenido.
    await expect(
      repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    await expect(
      repos.solicitudes.guardar(borrador.id, { comentarioInterno: 'tarde' }, PERSONAL),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });
  });
});

describe('flujo crítico: devolución y corrección', () => {
  it('devuelve al estudiante, acepta la corrección y vuelve a revisión', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);

    // Sin motivo, la devolución se rechaza.
    await expect(
      repos.solicitudes.transicionar(borrador.id, 'devuelta', PERSONAL),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    const devuelta = await repos.solicitudes.transicionar(borrador.id, 'devuelta', PERSONAL, {
      comentario: 'Falta la firma del responsable de recursos humanos en la carta.',
    });
    expect(devuelta.estado).toBe('devuelta');
    expect(devuelta.historial.at(-1)?.comentario).toContain('firma del responsable');

    // El personal no puede corregir por el estudiante.
    await expect(
      repos.solicitudes.transicionar(borrador.id, 'corregida', PERSONAL),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    const corregida = await repos.solicitudes.transicionar(borrador.id, 'corregida', ESTUDIANTE);
    expect(corregida.estado).toBe('corregida');

    const deNuevoEnRevision = await repos.solicitudes.transicionar(
      borrador.id,
      'en_revision',
      PERSONAL,
    );
    expect(deNuevoEnRevision.estado).toBe('en_revision');
    expect(deNuevoEnRevision.historial).toHaveLength(6);
  });
});

describe('flujo crítico: rechazo con justificación', () => {
  it('exige 30 caracteres y registra el motivo en el historial', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);

    await expect(
      repos.solicitudes.transicionar(borrador.id, 'rechazada', PERSONAL, { comentario: 'No.' }),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    const rechazada = await repos.solicitudes.transicionar(borrador.id, 'rechazada', PERSONAL, {
      comentario: JUSTIFICACION,
    });

    expect(rechazada.estado).toBe('rechazada');
    expect(rechazada.historial.at(-1)?.comentario).toBe(JUSTIFICACION);
    expect(rechazada.historial.at(-1)?.autorId).toBe(PERSONAL.id);
  });
});

describe('autorización a lo largo del flujo', () => {
  it('impide a un estudiante ajeno operar sobre la solicitud', async () => {
    const borrador = await crearBorrador();

    await expect(
      repos.solicitudes.transicionar(borrador.id, 'enviada', OTRO_ESTUDIANTE),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });
  });

  it('permite al coordinador aprobar una solicitud en revisión', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);

    const aprobada = await repos.solicitudes.transicionar(borrador.id, 'aprobada', COORDINADOR);
    expect(aprobada.estado).toBe('aprobada');
    expect(aprobada.historial.at(-1)?.autorId).toBe(COORDINADOR.id);
  });

  it('impide al administrador del sistema intervenir en el flujo', async () => {
    const borrador = await crearBorrador();

    await expect(
      repos.solicitudes.transicionar(borrador.id, 'enviada', ADMIN),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });
  });
});
