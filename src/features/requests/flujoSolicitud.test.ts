// @vitest-environment node
/**
 * Pruebas de integración del ciclo de vida completo de una solicitud.
 *
 * Recorren repositorios HTTP y API simulada juntos: crear → enviar → revisar →
 * aprobar → completar, comprobando que el historial queda íntegro y que los
 * atajos inválidos se rechazan en cada punto del camino.
 */

import { describe, expect, it } from 'vitest';

import { repositorios } from '@/data';
import { registrarArchivo } from '@/data/archivos';
import type { Actor, Adjunto, EstadoSolicitud } from '@/domain/types';
import { iniciarSesionSimulada } from '@/mocks/base';

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

function esActor(valor: unknown): valor is Actor {
  return typeof valor === 'object' && valor !== null && 'rol' in valor && 'id' in valor;
}

/**
 * Cada llamada abre antes la sesión del actor que recibe, como si cada usuario
 * operara desde su navegador: así el servidor simulado aplica sus permisos.
 */
function conSesionDelActor<T extends object>(repo: T): T {
  return new Proxy(repo, {
    get(objetivo, clave) {
      const valor: unknown = Reflect.get(objetivo, clave);
      if (typeof valor !== 'function') return valor;
      return (...argumentos: unknown[]) => {
        const actor = argumentos.find(esActor);
        if (actor) iniciarSesionSimulada(actor.id);
        return (valor as (...a: unknown[]) => unknown).apply(objetivo, argumentos);
      };
    },
  });
}

const repos = { solicitudes: conSesionDelActor(repositorios.solicitudes) };

/** Adjunto pendiente de subir, con su archivo registrado. */
function adjuntoNuevo(id: string, nombre: string): Adjunto {
  const archivo = new File(['%PDF-1.4'], nombre, { type: 'application/pdf' });
  registrarArchivo(id, archivo);
  return {
    id,
    nombre,
    tamano: archivo.size,
    tipo: archivo.type,
    subidoEn: new Date().toISOString(),
  };
}

/** Crea un borrador de carta de pasantía para el estudiante. */
async function crearBorrador() {
  return repos.solicitudes.crear(
    {
      servicioId: 'pasantia',
      solicitanteId: ESTUDIANTE.id,
      datosFormulario: { empresa: 'TechCorp Solutions S.R.L.', cargo: 'Pasante de desarrollo' },
      adjuntos: [adjuntoNuevo('adj-nuevo', 'carta_aceptacion.pdf')],
    },
    ESTUDIANTE,
  );
}

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

describe('flujo crítico: el estudiante corrige datos y documentos tras una devolución', () => {
  it('permite modificar campos y adjuntos, y el revisor ve la versión corregida', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);
    await repos.solicitudes.transicionar(borrador.id, 'devuelta', PERSONAL, {
      comentario: 'La carta no está en papel membretado; adjunta la versión correcta.',
    });

    // El estudiante corrige el formulario y sustituye el documento.
    const corregidaEnDatos = await repos.solicitudes.guardar(
      borrador.id,
      {
        datosFormulario: {
          empresa: 'TechCorp Solutions S.R.L.',
          cargo: 'Pasante de ingeniería de datos',
        },
        adjuntos: [adjuntoNuevo('adj-corregido', 'carta_aceptacion_membretada.pdf')],
      },
      ESTUDIANTE,
    );

    expect(corregidaEnDatos.datosFormulario.cargo).toBe('Pasante de ingeniería de datos');
    expect(corregidaEnDatos.adjuntos).toHaveLength(1);
    expect(corregidaEnDatos.adjuntos[0]?.nombre).toBe('carta_aceptacion_membretada.pdf');
    // Editar el contenido no altera el estado ni añade entradas al historial.
    expect(corregidaEnDatos.estado).toBe('devuelta');
    expect(corregidaEnDatos.historial).toHaveLength(4);

    // Y sólo entonces envía la corrección.
    const corregida = await repos.solicitudes.transicionar(borrador.id, 'corregida', ESTUDIANTE);
    expect(corregida.estado).toBe('corregida');

    // Lo que el revisor recupera es ya la versión corregida.
    const vistaDelRevisor = await repos.solicitudes.obtener(borrador.id);
    expect(vistaDelRevisor?.datosFormulario.cargo).toBe('Pasante de ingeniería de datos');
    expect(vistaDelRevisor?.adjuntos[0]?.nombre).toBe('carta_aceptacion_membretada.pdf');
  });

  it('impide al estudiante editar mientras la solicitud está en revisión', async () => {
    const borrador = await crearBorrador();
    await repos.solicitudes.transicionar(borrador.id, 'enviada', ESTUDIANTE);
    await repos.solicitudes.transicionar(borrador.id, 'en_revision', PERSONAL);

    await expect(
      repos.solicitudes.guardar(borrador.id, { datosFormulario: { cargo: 'Otro' } }, ESTUDIANTE),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    // Los datos originales siguen intactos para el revisor.
    const sinCambios = await repos.solicitudes.obtener(borrador.id);
    expect(sinCambios?.datosFormulario.cargo).toBe('Pasante de desarrollo');
  });

  it('permite al estudiante seguir editando su borrador antes de enviarlo', async () => {
    const borrador = await crearBorrador();
    const editado = await repos.solicitudes.guardar(
      borrador.id,
      { datosFormulario: { empresa: 'Otra Empresa S.R.L.', cargo: 'Pasante' } },
      ESTUDIANTE,
    );
    expect(editado.datosFormulario.empresa).toBe('Otra Empresa S.R.L.');
    expect(editado.estado).toBe('borrador');
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

    // Para él la solicitud ni siquiera existe.
    await expect(
      repos.solicitudes.transicionar(borrador.id, 'enviada', OTRO_ESTUDIANTE),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
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
