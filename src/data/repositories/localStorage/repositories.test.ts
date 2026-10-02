import { beforeEach, describe, expect, it } from 'vitest';

import { CLAVE_ALMACEN, migrar, SERVIS_SCHEMA_VERSION } from '@/data/schema';
import { ErrorRepositorio } from '@/data/repositories/types';
import { METAS_POR_DEFECTO } from '@/domain/indicadores';
import type { Actor } from '@/domain/types';

import { registrarArchivo } from '@/data/archivos';

import { almacenInicial, restablecerAlmacen } from './almacen';
import { RepositorioAuthLocal } from './authRepository';
import { RepositorioMetasLocal } from './metasRepository';
import { RepositorioServiciosLocal } from './serviceRepository';
import { RepositorioSolicitudesLocal } from './requestRepository';
import { RepositorioUsuariosLocal } from './userRepository';

const solicitudes = new RepositorioSolicitudesLocal();
const usuarios = new RepositorioUsuariosLocal();
const servicios = new RepositorioServiciosLocal();

const LUIS: Actor = { id: 'usr-luis', nombre: 'Luis Batista', rol: 'estudiante' };
const RICARDO: Actor = {
  id: 'usr-ricardo',
  nombre: 'Ricardo Almanzar',
  rol: 'personal_administrativo',
};

/** Solicitudes de un almacén recién sembrado: las 8 del prototipo más el historial. */
const totalSembrado = () => almacenInicial().solicitudes.length;

beforeEach(() => {
  localStorage.clear();
  restablecerAlmacen();
});

describe('sembrado inicial', () => {
  it('siembra las solicitudes SRV-1035 a SRV-1042 del prototipo', async () => {
    const lista = await solicitudes.listar();
    // Las SRV-09xx son el historial cerrado del cuadro de mando.
    const ids = lista
      .map((s) => s.id)
      .filter((id) => id.startsWith('SRV-10'))
      .sort();
    expect(ids).toEqual([
      'SRV-1035',
      'SRV-1036',
      'SRV-1037',
      'SRV-1038',
      'SRV-1039',
      'SRV-1040',
      'SRV-1041',
      'SRV-1042',
    ]);
  });

  it('siembra el catálogo de 11 servicios y los usuarios del equipo', async () => {
    expect(await servicios.listar()).toHaveLength(11);

    const equipo = await usuarios.listar();
    const nombres = equipo.map((u) => u.nombre);
    for (const integrante of [
      'Luis Batista',
      'Adán León',
      'Gerald Jimeno',
      'Ricardo Almanzar',
      'Axell Feliz',
      'Edwin López',
    ]) {
      expect(nombres).toContain(integrante);
    }
  });

  it('produce solicitudes con historial coherente con la máquina de estados', async () => {
    const lista = await solicitudes.listar();
    for (const solicitud of lista) {
      // El primer registro siempre es la creación del borrador.
      expect(solicitud.historial[0]?.estadoNuevo).toBe('borrador');
      // El último registro coincide con el estado actual.
      expect(solicitud.historial.at(-1)?.estadoNuevo).toBe(solicitud.estado);
      // La cadena de estados no tiene saltos.
      for (let i = 1; i < solicitud.historial.length; i += 1) {
        expect(solicitud.historial[i]?.estadoAnterior).toBe(
          solicitud.historial[i - 1]?.estadoNuevo,
        );
      }
    }
  });

  it('siembra automáticamente cuando el almacén está vacío', async () => {
    localStorage.clear();
    expect(localStorage.getItem(CLAVE_ALMACEN)).toBeNull();

    const lista = await solicitudes.listar();
    expect(lista.length).toBeGreaterThan(0);
    expect(localStorage.getItem(CLAVE_ALMACEN)).not.toBeNull();
  });

  it('vuelve a sembrar si el contenido guardado está corrupto', async () => {
    localStorage.setItem(CLAVE_ALMACEN, 'esto no es JSON válido {{{');
    expect(await solicitudes.listar()).toHaveLength(totalSembrado());
  });
});

describe('versionado y migración del esquema', () => {
  it('acepta un almacén en la versión actual', () => {
    const resultado = migrar(almacenInicial());
    expect(resultado).not.toBeNull();
    expect(resultado?.version).toBe(SERVIS_SCHEMA_VERSION);
  });

  it('descarta un almacén con forma irreconocible', () => {
    expect(migrar({ cualquierCosa: true })).toBeNull();
    expect(migrar(null)).toBeNull();
    expect(migrar('texto')).toBeNull();
  });

  it('descarta un almacén escrito por una versión futura', () => {
    const futuro = { ...almacenInicial(), version: SERVIS_SCHEMA_VERSION + 1 };
    expect(migrar(futuro)).toBeNull();
  });

  it('migra un almacén v1 añadiendo el documento de las solicitudes completadas', () => {
    const actual = almacenInicial();
    const v1 = {
      ...actual,
      version: 1,
      solicitudes: actual.solicitudes.map(({ documento: _documento, ...resto }) => resto),
    };

    const migrado = migrar(v1);

    const completada = migrado?.solicitudes.find((s) => s.id === 'SRV-1039');
    expect(completada?.documento?.nombre).toMatch(/-SRV-1039\.pdf$/);
    const abierta = migrado?.solicitudes.find((s) => s.id === 'SRV-1042');
    expect(abierta?.documento).toBeNull();
  });

  it('migra un almacén v2 añadiendo las metas y el historial del cuadro de mando', () => {
    const { metas: _metas, ...actual } = almacenInicial();
    const v2 = {
      ...actual,
      version: 2,
      solicitudes: actual.solicitudes.filter((s) => s.id.startsWith('SRV-10')),
    };

    const migrado = migrar(v2);

    expect(migrado?.metas).toEqual(METAS_POR_DEFECTO);
    expect(migrado?.solicitudes.some((s) => s.id.startsWith('SRV-09'))).toBe(true);
    expect(migrado?.solicitudes.filter((s) => s.id.startsWith('SRV-10'))).toHaveLength(8);
  });

  it('descarta datos sin versión, para los que no hay migración registrada', () => {
    const sinVersion = { solicitudes: [], usuarios: [], servicios: [] };
    expect(migrar(sinVersion)).toBeNull();
  });
});

describe('repositorio de solicitudes', () => {
  it('filtra por solicitante', async () => {
    const propias = await solicitudes.listar({ solicitanteId: 'usr-luis' });
    expect(propias.length).toBeGreaterThan(0);
    expect(propias.every((s) => s.solicitanteId === 'usr-luis')).toBe(true);
  });

  it('filtra por estado y por servicio', async () => {
    const enRevision = await solicitudes.listar({ estados: ['en_revision'] });
    expect(enRevision.every((s) => s.estado === 'en_revision')).toBe(true);

    const pasantias = await solicitudes.listar({ servicioId: 'pasantia' });
    expect(pasantias.every((s) => s.servicioId === 'pasantia')).toBe(true);
  });

  it('crea una solicitud en borrador con identificador correlativo', async () => {
    const creada = await solicitudes.crear(
      { servicioId: 'carnet', solicitanteId: 'usr-luis', datosFormulario: { motivo: 'Extravío' } },
      LUIS,
    );

    expect(creada.id).toBe('SRV-1043');
    expect(creada.estado).toBe('borrador');
    expect(creada.historial).toHaveLength(1);
    expect(await solicitudes.obtener('SRV-1043')).not.toBeNull();
  });

  it('persiste los cambios entre instancias del repositorio', async () => {
    await solicitudes.crear(
      { servicioId: 'carnet', solicitanteId: 'usr-luis', datosFormulario: {} },
      LUIS,
    );

    // Una instancia nueva lee del mismo almacén.
    const otra = new RepositorioSolicitudesLocal();
    expect(await otra.obtener('SRV-1043')).not.toBeNull();
  });

  it('devuelve null al pedir una solicitud inexistente', async () => {
    expect(await solicitudes.obtener('SRV-9999')).toBeNull();
  });

  it('rechaza guardar sobre una solicitud inexistente', async () => {
    await expect(
      solicitudes.guardar('SRV-9999', { comentarioInterno: 'x' }, RICARDO),
    ).rejects.toThrow(ErrorRepositorio);
  });

  it('propaga las reglas de dominio como ErrorRepositorio', async () => {
    // SRV-1039 está completada: es inmutable.
    await expect(
      solicitudes.transicionar('SRV-1039', 'en_revision', RICARDO),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });

    // Rechazar sin justificación suficiente.
    await expect(
      solicitudes.transicionar('SRV-1042', 'rechazada', RICARDO, { comentario: 'No.' }),
    ).rejects.toMatchObject({ codigo: 'REGLA_DE_NEGOCIO' });
  });

  it('asigna la solicitud a quien la toma en revisión', async () => {
    const enviada = await solicitudes.transicionar('SRV-1038', 'en_revision', RICARDO);
    expect(enviada.estado).toBe('en_revision');
    expect(enviada.asignadaA).toBe('usr-ricardo');
  });

  it('elimina una solicitud existente y falla con una inexistente', async () => {
    await solicitudes.eliminar('SRV-1035');
    expect(await solicitudes.obtener('SRV-1035')).toBeNull();
    await expect(solicitudes.eliminar('SRV-1035')).rejects.toThrow(ErrorRepositorio);
  });
});

describe('repositorio de usuarios', () => {
  it('busca por correo institucional sin distinguir mayúsculas', async () => {
    const usuario = await usuarios.obtenerPorCorreo('L.BATISTA@intec.edu.do');
    expect(usuario?.nombre).toBe('Luis Batista');
  });

  it('filtra por rol y por estado de activación', async () => {
    const estudiantes = await usuarios.listar({ rol: 'estudiante' });
    expect(estudiantes.every((u) => u.rol === 'estudiante')).toBe(true);

    const inactivos = await usuarios.listar({ activo: false });
    expect(inactivos.map((u) => u.nombre)).toContain('Miguel Torres');
  });

  it('impide crear dos usuarios con el mismo correo', async () => {
    await expect(
      usuarios.crear({
        nombre: 'Luis Batista',
        correo: 'l.batista@intec.edu.do',
        rol: 'estudiante',
        iniciales: 'LB',
        colorAvatar: 'blue',
        activo: true,
      }),
    ).rejects.toMatchObject({ codigo: 'CONFLICTO' });
  });

  it('cambia la activación de un usuario', async () => {
    const usuario = await usuarios.cambiarActivacion('usr-miguel', true);
    expect(usuario.activo).toBe(true);
  });
});

describe('repositorio de servicios', () => {
  it('filtra los servicios activos', async () => {
    const activos = await servicios.listar({ soloActivos: true });
    expect(activos.every((s) => s.activo)).toBe(true);
    expect(activos.length).toBeLessThan(11);
  });

  it('aplica la regla de requisitos al activar', async () => {
    const sinRequisitos = await servicios.crear({
      nombre: 'Servicio de prueba',
      descripcion: 'Sin requisitos definidos.',
      icono: '🧪',
      color: '#EEE',
      categoria: 'administrativo',
      requisitos: [],
      plantilla: 'ninguna.docx',
      activo: false,
      diasEstimados: 1,
    });
    expect(sinRequisitos.activo).toBe(false);

    await expect(servicios.cambiarActivacion(sinRequisitos.id, true)).rejects.toMatchObject({
      codigo: 'REGLA_DE_NEGOCIO',
    });
  });

  it('permite activar un servicio que sí tiene requisitos', async () => {
    const activado = await servicios.cambiarActivacion('objetos', true);
    expect(activado.activo).toBe(true);
  });

  it('impide dejar sin requisitos un servicio activo', async () => {
    await expect(servicios.actualizar('pasantia', { requisitos: [] })).rejects.toMatchObject({
      codigo: 'REGLA_DE_NEGOCIO',
    });
  });
});

describe('restablecer datos de demostración', () => {
  it('devuelve el almacén a su estado inicial', async () => {
    await solicitudes.eliminar('SRV-1035');
    await solicitudes.crear(
      { servicioId: 'carnet', solicitanteId: 'usr-luis', datosFormulario: {} },
      LUIS,
    );
    expect(await solicitudes.listar()).toHaveLength(totalSembrado());

    restablecerAlmacen();

    const restablecidas = await solicitudes.listar();
    expect(restablecidas).toHaveLength(totalSembrado());
    expect(restablecidas.map((s) => s.id)).toContain('SRV-1035');
    expect(restablecidas.map((s) => s.id)).not.toContain('SRV-1043');
  });
});

describe('documento de salida', () => {
  it('se emite al completar la solicitud y se descarga como PDF de muestra', async () => {
    const aprobada = await solicitudes.obtener('SRV-1041');
    expect(aprobada?.estado).toBe('aprobada');
    expect(aprobada?.documento).toBeNull();

    const completada = await solicitudes.transicionar('SRV-1041', 'completada', RICARDO);
    expect(completada.documento?.nombre).toBe('grado-y-posgrado-SRV-1041.pdf');

    const pdf = await solicitudes.descargarDocumento('SRV-1041');
    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1000);
  });

  it('no existe mientras la solicitud no esté completada', async () => {
    await expect(solicitudes.descargarDocumento('SRV-1042')).rejects.toMatchObject({
      codigo: 'REGLA_DE_NEGOCIO',
    });
  });
});

describe('adjuntos', () => {
  it('conserva durante la sesión el contenido de lo adjuntado', async () => {
    const archivo = new File(['hola'], 'nota.txt', { type: 'text/plain' });
    registrarArchivo('adj-prueba', archivo);
    const creada = await solicitudes.crear(
      {
        servicioId: 'pasantia',
        solicitanteId: LUIS.id,
        datosFormulario: {},
        adjuntos: [
          { id: 'adj-prueba', nombre: 'nota.txt', tamano: 4, tipo: 'text/plain', subidoEn: '' },
        ],
      },
      LUIS,
    );

    expect(await solicitudes.descargarAdjunto(creada.id, 'adj-prueba')).toBe(archivo);
  });

  it('explica que el contenido de los adjuntos de ejemplo no está disponible', async () => {
    const [adjunto] = (await solicitudes.obtener('SRV-1042'))?.adjuntos ?? [];
    await expect(solicitudes.descargarAdjunto('SRV-1042', adjunto?.id ?? '')).rejects.toThrow(
      /modo de demostración/,
    );
  });
});

describe('autenticación local', () => {
  const auth = new RepositorioAuthLocal();

  it('entra con el correo de una cuenta activa, sin verificar la contraseña', async () => {
    const usuario = await auth.iniciarSesion(' L.Batista@intec.edu.do ', '');
    expect(usuario.id).toBe('usr-luis');
  });

  it('rechaza correos desconocidos y cuentas desactivadas', async () => {
    await expect(auth.iniciarSesion('nadie@intec.edu.do', '')).rejects.toBeInstanceOf(
      ErrorRepositorio,
    );
    const inactivo = (await usuarios.listar()).find((u) => !u.activo);
    expect(inactivo).toBeDefined();
    await expect(auth.iniciarSesion(inactivo?.correo ?? '', '')).rejects.toMatchObject({
      codigo: 'NO_AUTENTICADO',
      message: expect.stringMatching(/desactivada/),
    });
  });
});

describe('metas del cuadro de mando', () => {
  const metas = new RepositorioMetasLocal();
  const AXELL: Actor = { id: 'usr-axell', nombre: 'Axell Feliz', rol: 'coordinador' };

  it('parte de las metas por defecto', async () => {
    expect(await metas.obtener()).toEqual(METAS_POR_DEFECTO);
  });

  it('el coordinador las cambia y quedan guardadas', async () => {
    await metas.guardar({ ...METAS_POR_DEFECTO, tiempoCiclo: 4 }, AXELL);
    expect((await metas.obtener()).tiempoCiclo).toBe(4);
  });

  it('el personal administrativo no puede cambiarlas', async () => {
    await expect(
      metas.guardar({ ...METAS_POR_DEFECTO, tiempoCiclo: 20 }, RICARDO),
    ).rejects.toMatchObject({ codigo: 'PROHIBIDO' });
    expect((await metas.obtener()).tiempoCiclo).toBe(METAS_POR_DEFECTO.tiempoCiclo);
  });
});
