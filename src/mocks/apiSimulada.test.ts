// @vitest-environment node
/**
 * Pruebas de la API simulada a través de los repositorios HTTP: lo mismo que
 * hará la aplicación contra Django. Fijan el comportamiento que el backend
 * debe reproducir (filtros, permisos, reglas y errores de `docs/api.md`).
 */

import { describe, expect, it } from 'vitest';

import { repositorios } from '@/data';
import { registrarArchivo } from '@/data/archivos';
import { METAS_POR_DEFECTO } from '@/domain/indicadores';
import type { Actor } from '@/domain/types';

import { baseSimulada, CONTRASENA_SIMULADA, iniciarSesionSimulada } from './base';
import { CUENTAS_SIMULADAS } from './cuentas';
import { USUARIOS_DEMO } from './datos/seed';

const { auth, solicitudes, usuarios, servicios, metas } = repositorios;

const LUIS: Actor = { id: 'usr-luis', nombre: 'Luis Batista', rol: 'estudiante' };
const RICARDO: Actor = {
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
};
const AXELL: Actor = { id: 'usr-axell', nombre: 'Axell Feliz', rol: 'coordinador' };

/** Lleva una solicitud del estudiante hasta `completada`. */
async function completar(id: string) {
  iniciarSesionSimulada(LUIS.id);
  await solicitudes.transicionar(id, 'enviada', LUIS);
  iniciarSesionSimulada(RICARDO.id);
  for (const destino of ['en_revision', 'aprobada', 'completada'] as const) {
    await solicitudes.transicionar(id, destino, RICARDO);
  }
}

async function nuevoBorrador() {
  iniciarSesionSimulada(LUIS.id);
  return solicitudes.crear(
    { servicioId: 'pasantia', solicitanteId: LUIS.id, datosFormulario: {}, adjuntos: [] },
    LUIS,
  );
}

describe('autenticación', () => {
  it('entra con la contraseña común y conserva la sesión', async () => {
    const usuario = await auth.iniciarSesion('L.Batista@intec.edu.do', CONTRASENA_SIMULADA);
    expect(usuario.id).toBe('usr-luis');
    expect((await auth.usuarioActual())?.id).toBe('usr-luis');
  });

  it('rechaza una contraseña incorrecta, un correo desconocido y una cuenta desactivada', async () => {
    await expect(auth.iniciarSesion('l.batista@intec.edu.do', 'otra')).rejects.toMatchObject({
      codigo: 'NO_AUTENTICADO',
    });
    await expect(
      auth.iniciarSesion('nadie@intec.edu.do', CONTRASENA_SIMULADA),
    ).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    await expect(
      auth.iniciarSesion('m.torres@intec.edu.do', CONTRASENA_SIMULADA),
    ).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
  });

  it('al cerrar la sesión deja de haber usuario', async () => {
    await auth.iniciarSesion('l.batista@intec.edu.do', CONTRASENA_SIMULADA);
    await auth.cerrarSesion();
    expect(await auth.usuarioActual()).toBeNull();
  });

  it('las cuentas que sugiere el acceso existen, están activas y tienen su rol', () => {
    for (const cuenta of CUENTAS_SIMULADAS) {
      const usuario = USUARIOS_DEMO.find((u) => u.correo === cuenta.correo);
      expect(usuario?.activo).toBe(true);
      expect(usuario?.rol).toBe(cuenta.rol);
    }
  });
});

describe('solicitudes', () => {
  it('el estudiante sólo ve las suyas y sin el comentario interno', async () => {
    iniciarSesionSimulada(LUIS.id);
    const propias = await solicitudes.listar();
    expect(propias.length).toBeGreaterThan(0);
    expect(propias.every((s) => s.solicitanteId === LUIS.id)).toBe(true);
    expect(propias.every((s) => !s.comentarioInterno)).toBe(true);
  });

  it('filtra por solicitante, estado, servicio y búsqueda', async () => {
    iniciarSesionSimulada(RICARDO.id);
    const deLuis = await solicitudes.listar({ solicitanteId: LUIS.id });
    expect(deLuis.every((s) => s.solicitanteId === LUIS.id)).toBe(true);

    const filtradas = await solicitudes.listar({
      estados: ['en_revision', 'enviada'],
      servicioId: 'pasantia',
    });
    expect(filtradas.length).toBeGreaterThan(0);
    for (const s of filtradas) {
      expect(['en_revision', 'enviada']).toContain(s.estado);
      expect(s.servicioId).toBe('pasantia');
    }

    expect((await solicitudes.listar({ busqueda: 'srv-1042' })).map((s) => s.id)).toEqual([
      'SRV-1042',
    ]);
    const porNombre = await solicitudes.listar({ busqueda: 'batista' });
    expect(porNombre.every((s) => s.solicitanteId === LUIS.id)).toBe(true);
  });

  it('crea un borrador con identificador correlativo', async () => {
    const borrador = await nuevoBorrador();
    expect(borrador.id).toBe('SRV-1043');
    expect(borrador.estado).toBe('borrador');
    expect(borrador.historial).toHaveLength(1);
  });

  it('sólo el estudiante crea solicitudes', async () => {
    iniciarSesionSimulada(RICARDO.id);
    await expect(
      solicitudes.crear(
        { servicioId: 'pasantia', solicitanteId: LUIS.id, datosFormulario: {}, adjuntos: [] },
        RICARDO,
      ),
    ).rejects.toMatchObject({ codigo: 'PROHIBIDO' });
  });

  it('devuelve null para una inexistente y falla al guardarla', async () => {
    iniciarSesionSimulada(RICARDO.id);
    expect(await solicitudes.obtener('SRV-0000')).toBeNull();
    await expect(
      solicitudes.guardar('SRV-0000', { comentarioInterno: 'x' }, RICARDO),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });

  it('asigna la solicitud a quien la toma en revisión', async () => {
    const { id } = await nuevoBorrador();
    await solicitudes.transicionar(id, 'enviada', LUIS);
    iniciarSesionSimulada(RICARDO.id);
    const tomada = await solicitudes.transicionar(id, 'en_revision', RICARDO);
    expect(tomada.asignadaA).toBe(RICARDO.id);
  });

  it('elimina un borrador', async () => {
    const { id } = await nuevoBorrador();
    await solicitudes.eliminar(id);
    expect(await solicitudes.obtener(id)).toBeNull();
  });
});

describe('adjuntos y documento de salida', () => {
  it('sube un adjunto y lo devuelve con el mismo contenido', async () => {
    const { id } = await nuevoBorrador();
    const archivo = new File(['contenido de prueba'], 'cedula.pdf', { type: 'application/pdf' });
    registrarArchivo('adj-temporal', archivo);
    const guardada = await solicitudes.guardar(
      id,
      {
        adjuntos: [
          {
            id: 'adj-temporal',
            nombre: 'cedula.pdf',
            tamano: archivo.size,
            tipo: archivo.type,
            subidoEn: new Date().toISOString(),
          },
        ],
      },
      LUIS,
    );
    const [adjunto] = guardada.adjuntos;
    expect(adjunto?.nombre).toBe('cedula.pdf');
    // El identificador definitivo lo asigna el servidor.
    expect(adjunto?.id).not.toBe('adj-temporal');

    const descargado = await solicitudes.descargarAdjunto(id, adjunto?.id ?? '');
    expect(await descargado.text()).toBe('contenido de prueba');
  });

  it('emite el documento al completar y lo sirve como PDF', async () => {
    const { id } = await nuevoBorrador();
    await expect(solicitudes.descargarDocumento(id)).rejects.toBeDefined();

    await completar(id);
    const completada = await solicitudes.obtener(id);
    expect(completada?.documento).not.toBeNull();

    const pdf = await solicitudes.descargarDocumento(id);
    expect(pdf.type).toBe('application/pdf');
    expect(new TextDecoder().decode(await pdf.slice(0, 5).arrayBuffer())).toBe('%PDF-');
  });
});

describe('usuarios', () => {
  it('el estudiante no puede listarlos', async () => {
    iniciarSesionSimulada(LUIS.id);
    await expect(usuarios.listar()).rejects.toMatchObject({ codigo: 'PROHIBIDO' });
  });

  it('busca por correo sin distinguir mayúsculas y filtra por rol y activación', async () => {
    iniciarSesionSimulada('usr-edwin');
    expect((await usuarios.obtenerPorCorreo('A.FELIZ@intec.edu.do'))?.id).toBe('usr-axell');
    const inactivos = await usuarios.listar({ rol: 'estudiante', activo: false });
    expect(inactivos.map((u) => u.id)).toEqual(['usr-miguel']);
  });

  it('impide duplicar un correo y cambia la activación', async () => {
    iniciarSesionSimulada('usr-edwin');
    const [existente] = USUARIOS_DEMO;
    if (!existente) throw new Error('Faltan usuarios sembrados.');
    const { id: _id, ultimoAcceso: _ultimo, ...datos } = existente;
    await expect(usuarios.crear(datos)).rejects.toMatchObject({ codigo: 'CONFLICTO' });

    const desactivado = await usuarios.cambiarActivacion('usr-adan', false);
    expect(desactivado.activo).toBe(false);
  });
});

describe('servicios', () => {
  it('filtra los activos', async () => {
    const activos = await servicios.listar({ soloActivos: true });
    expect(activos.length).toBeGreaterThan(0);
    expect(activos.every((s) => s.activo)).toBe(true);
  });

  it('crea un servicio y no deja activarlo sin requisitos', async () => {
    iniciarSesionSimulada('usr-edwin');
    const creado = await servicios.crear({
      nombre: 'Constancia de estudios',
      descripcion: 'Certifica la inscripción vigente.',
      icono: '📄',
      color: 'var(--c-primary-light)',
      categoria: 'academico',
      requisitos: [],
      plantilla: 'plantilla_constancia_v1.docx',
      activo: false,
      diasEstimados: 2,
    });
    expect(creado.id).toBe('constancia-de-estudios');
    expect(baseSimulada().servicios.some((s) => s.id === creado.id)).toBe(true);

    await expect(servicios.cambiarActivacion(creado.id, true)).rejects.toMatchObject({
      codigo: 'REGLA_DE_NEGOCIO',
    });
  });
});

describe('metas del cuadro de mando', () => {
  it('parten de los valores por defecto y sólo el coordinador las cambia', async () => {
    iniciarSesionSimulada(RICARDO.id);
    expect(await metas.obtener()).toEqual(METAS_POR_DEFECTO);
    const nuevas = { ...METAS_POR_DEFECTO, productividad: 90 };
    await expect(metas.guardar(nuevas, RICARDO)).rejects.toMatchObject({ codigo: 'PROHIBIDO' });

    iniciarSesionSimulada(AXELL.id);
    expect((await metas.guardar(nuevas, AXELL)).productividad).toBe(90);
    expect((await metas.obtener()).productividad).toBe(90);
  });
});
