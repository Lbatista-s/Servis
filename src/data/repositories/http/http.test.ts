/** Pruebas de la capa HTTP contra un `fetch` simulado. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { archivoRegistrado, registrarArchivo } from '@/data/archivos';
import { ErrorRepositorio } from '@/data/repositories/types';
import type { Actor, Adjunto } from '@/domain/types';

import { aCamel, aSnake, clavesACamel, clavesASnake } from './casos';
import { RepositorioAuthHttp, RepositorioSolicitudesHttp, RepositorioUsuariosHttp } from './index';
import { alCaducarSesion, guardarTokens, leerTokens } from './sesion';

interface Llamada {
  url: URL;
  metodo: string;
  cabeceras: Headers;
  cuerpo: BodyInit | null | undefined;
  credenciales: RequestCredentials | undefined;
}

let llamadas: Llamada[] = [];

/** Sustituye `fetch` por un manejador que recibe la ruta sin el prefijo `/api`. */
function servidor(manejador: (ruta: string, llamada: Llamada) => Response | Promise<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string, init: RequestInit = {}) => {
      const llamada: Llamada = {
        url: new URL(entrada, 'http://localhost'),
        metodo: init.method ?? 'GET',
        cabeceras: new Headers(init.headers),
        cuerpo: init.body,
        credenciales: init.credentials,
      };
      llamadas.push(llamada);
      return manejador(llamada.url.pathname.replace(/^\/api/, ''), llamada);
    }),
  );
}

const json = (cuerpo: unknown, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });

const cuerpoJson = (llamada: Llamada | undefined) =>
  JSON.parse(String(llamada?.cuerpo)) as Record<string, unknown>;

/** Solicitud tal como la devolvería Django REST Framework. */
function solicitudDto(extra: Record<string, unknown> = {}) {
  return {
    id: 1042,
    servicio_id: 3,
    solicitante_id: 7,
    estado: 'completada',
    creada_en: '2026-07-02T10:00:00Z',
    actualizada_en: '2026-07-05T10:00:00Z',
    enviada_en: '2026-07-02T11:00:00Z',
    datos_formulario: { nombre_empresa: 'TechCorp', fecha_inicio: '2026-08-01' },
    adjuntos: [
      {
        id: 9,
        nombre: 'cv.pdf',
        tamano: 1200,
        tipo: 'application/pdf',
        subido_en: '2026-07-02T10:00:00Z',
      },
    ],
    historial: [
      {
        id: 1,
        autor_id: 7,
        autor_nombre: 'Luis Batista',
        fecha: '2026-07-02T10:00:00Z',
        estado_anterior: null,
        estado_nuevo: 'borrador',
        comentario: null,
      },
    ],
    comentario_interno: '',
    asignada_a: null,
    prioridad: 'normal',
    documento: { nombre: 'carta-de-pasantia-1042.pdf', generado_en: '2026-07-05T10:00:00Z' },
    ...extra,
  };
}

const LUIS: Actor = { id: '7', nombre: 'Luis Batista', rol: 'estudiante' };
const solicitudes = new RepositorioSolicitudesHttp();

beforeEach(() => {
  llamadas = [];
  vi.stubEnv('VITE_API_BASE_URL', '/api');
  vi.stubEnv('VITE_API_AUTH', 'sesion');
  document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  guardarTokens(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('conversión de claves', () => {
  it('convierte entre snake_case y camelCase', () => {
    expect(aCamel('asignada_a')).toBe('asignadaA');
    expect(aSnake('comentarioInterno')).toBe('comentario_interno');
  });

  it('no toca los valores ni los campos del formulario dinámico', () => {
    const dominio = clavesACamel({
      estado_nuevo: 'en_revision',
      datos_formulario: { fecha_inicio: '2026-08-01' },
    });
    expect(dominio).toEqual({
      estadoNuevo: 'en_revision',
      datosFormulario: { fecha_inicio: '2026-08-01' },
    });
    expect(clavesASnake({ datosFormulario: { fechaInicio: 'x' } })).toEqual({
      datos_formulario: { fechaInicio: 'x' },
    });
  });
});

describe('solicitudes', () => {
  it('traduce el JSON de Django al dominio', async () => {
    servidor(() => json(solicitudDto()));
    const solicitud = await solicitudes.obtener('1042');

    expect(solicitud).toMatchObject({
      id: '1042',
      servicioId: '3',
      solicitanteId: '7',
      enviadaEn: '2026-07-02T11:00:00Z',
      datosFormulario: { nombre_empresa: 'TechCorp', fecha_inicio: '2026-08-01' },
      documento: { nombre: 'carta-de-pasantia-1042.pdf', generadoEn: '2026-07-05T10:00:00Z' },
    });
    expect(solicitud?.adjuntos[0]).toMatchObject({ id: '9', subidoEn: '2026-07-02T10:00:00Z' });
    expect(solicitud?.historial[0]).toMatchObject({
      solicitudId: '1042',
      autorId: '7',
      estadoAnterior: null,
    });
    expect(llamadas[0]?.url.pathname).toBe('/api/solicitudes/1042/');
  });

  it('envía los filtros y recorre todas las páginas de DRF', async () => {
    servidor((_ruta, { url }) =>
      url.searchParams.get('page') === '2'
        ? json({ count: 2, next: null, results: [solicitudDto({ id: 2 })] })
        : json({
            count: 2,
            next: 'http://backend.interno:8000/api/solicitudes/?estado=enviada&estado=corregida&page=2',
            results: [solicitudDto({ id: 1 })],
          }),
    );

    const lista = await solicitudes.listar({
      estados: ['enviada', 'corregida'],
      solicitanteId: '7',
    });

    expect(lista.map((s) => s.id)).toEqual(['1', '2']);
    expect(llamadas[0]?.url.searchParams.getAll('estado')).toEqual(['enviada', 'corregida']);
    expect(llamadas[0]?.url.searchParams.get('solicitante')).toBe('7');
    // La segunda página se pide al mismo origen, conservando los filtros repetidos.
    expect(llamadas[1]?.url.host).toBe('localhost');
    expect(llamadas[1]?.url.searchParams.getAll('estado')).toEqual(['enviada', 'corregida']);
  });

  it('devuelve null cuando la solicitud no existe', async () => {
    servidor(() => json({ detail: 'No encontrado.' }, 404));
    expect(await solicitudes.obtener('999')).toBeNull();
  });

  it('transiciona enviando el comentario, con CSRF y en snake_case', async () => {
    document.cookie = 'csrftoken=abc123';
    servidor(() => json(solicitudDto({ estado: 'devuelta' })));

    await solicitudes.transicionar('1042', 'devuelta', LUIS, { comentario: ' Falta el CV. ' });

    const [llamada] = llamadas;
    expect(llamada?.url.pathname).toBe('/api/solicitudes/1042/transiciones/');
    expect(llamada?.metodo).toBe('POST');
    expect(llamada?.cabeceras.get('X-CSRFToken')).toBe('abc123');
    expect(llamada?.credenciales).toBe('include');
    expect(cuerpoJson(llamada)).toEqual({ hacia: 'devuelta', comentario: 'Falta el CV.' });
  });

  it('crea la solicitud y sube sus adjuntos nuevos', async () => {
    const adjunto: Adjunto = {
      id: 'adj-local-1',
      nombre: 'carta.pdf',
      tamano: 3,
      tipo: 'application/pdf',
      subidoEn: '2026-07-02T10:00:00Z',
    };
    registrarArchivo(adjunto.id, new File(['pdf'], 'carta.pdf', { type: 'application/pdf' }));
    servidor((ruta, { metodo }) =>
      ruta === '/solicitudes/' && metodo === 'POST'
        ? json(solicitudDto({ id: 50, estado: 'borrador', adjuntos: [] }), 201)
        : ruta === '/solicitudes/50/adjuntos/'
          ? json({ id: 77, nombre: 'carta.pdf', tamano: 3, tipo: 'application/pdf' }, 201)
          : json(solicitudDto({ id: 50, estado: 'borrador' })),
    );

    const creada = await solicitudes.crear(
      {
        servicioId: '3',
        solicitanteId: '7',
        datosFormulario: { motivo: 'x' },
        adjuntos: [adjunto],
      },
      LUIS,
    );

    expect(creada.id).toBe('50');
    expect(cuerpoJson(llamadas[0])).toEqual({
      servicio_id: '3',
      datos_formulario: { motivo: 'x' },
    });
    const subida = llamadas[1];
    expect(subida?.url.pathname).toBe('/api/solicitudes/50/adjuntos/');
    expect(subida?.cuerpo).toBeInstanceOf(FormData);
    expect(subida?.cabeceras.get('Content-Type')).toBeNull();
    expect((subida?.cuerpo as FormData).get('archivo')).toBeInstanceOf(File);
    // Una vez subido, el archivo deja de estar pendiente.
    expect(archivoRegistrado(adjunto.id)).toBeUndefined();
  });

  it('al guardar borra del servidor los adjuntos que se quitaron', async () => {
    servidor((_ruta, { metodo }) =>
      metodo === 'DELETE' ? new Response(null, { status: 204 }) : json(solicitudDto()),
    );

    await solicitudes.guardar('1042', { adjuntos: [] }, LUIS);

    expect(llamadas.map((l) => `${l.metodo} ${l.url.pathname}`)).toContain(
      'DELETE /api/solicitudes/1042/adjuntos/9/',
    );
  });

  it('descarga el documento de salida como archivo', async () => {
    servidor(
      () =>
        new Response('%PDF-1.7', { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    );
    const blob = await solicitudes.descargarDocumento('1042');
    expect(blob.type).toBe('application/pdf');
    expect(llamadas[0]?.url.pathname).toBe('/api/solicitudes/1042/documento/');
  });
});

describe('errores', () => {
  const usuarios = new RepositorioUsuariosHttp();

  it.each([
    [
      400,
      { correo: ['Ya existe un usuario con este correo.'] },
      'REGLA_DE_NEGOCIO',
      'correo: Ya existe un usuario con este correo.',
    ],
    [400, { non_field_errors: ['Datos incompletos.'] }, 'REGLA_DE_NEGOCIO', 'Datos incompletos.'],
    [403, { detail: 'No tiene permiso.' }, 'PROHIBIDO', 'No tiene permiso.'],
    [409, { detail: 'Conflicto de versión.' }, 'CONFLICTO', 'Conflicto de versión.'],
    [
      500,
      { detail: 'Traceback…' },
      'ERROR_RED',
      'El servidor no pudo procesar la petición. Inténtalo más tarde.',
    ],
  ])('traduce un %i al error del dominio', async (estado, cuerpo, codigo, mensaje) => {
    servidor(() => json(cuerpo, estado));
    const fallo = await usuarios.crear({} as never).catch((e: unknown) => e);
    expect(fallo).toBeInstanceOf(ErrorRepositorio);
    expect(fallo).toMatchObject({ codigo, message: mensaje });
  });

  it('informa cuando no hay conexión con el servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(usuarios.listar()).rejects.toMatchObject({ codigo: 'ERROR_RED' });
  });

  it('un 401 cierra la sesión', async () => {
    const caducada = vi.fn();
    alCaducarSesion(caducada);
    servidor(() => json({ detail: 'No autenticado.' }, 401));

    await expect(usuarios.listar()).rejects.toMatchObject({ codigo: 'NO_AUTENTICADO' });
    expect(caducada).toHaveBeenCalledOnce();
  });
});

describe('autenticación', () => {
  const auth = new RepositorioAuthHttp();
  const usuarioDto = {
    id: 7,
    nombre: 'Luis Batista',
    correo: 'l.batista@intec.edu.do',
    rol: 'estudiante',
  };

  it('con sesión de Django pide la cookie CSRF antes de iniciar sesión', async () => {
    servidor((ruta) => {
      if (ruta === '/auth/csrf/') {
        document.cookie = 'csrftoken=nuevo';
        return new Response(null, { status: 204 });
      }
      return json(usuarioDto);
    });

    const usuario = await auth.iniciarSesion('l.batista@intec.edu.do', 'secreta');

    expect(llamadas.map((l) => l.url.pathname)).toEqual(['/api/auth/csrf/', '/api/auth/login/']);
    expect(llamadas[1]?.cabeceras.get('X-CSRFToken')).toBe('nuevo');
    expect(cuerpoJson(llamadas[1])).toEqual({
      correo: 'l.batista@intec.edu.do',
      contrasena: 'secreta',
    });
    // La API no envía datos de presentación: se derivan.
    expect(usuario).toMatchObject({ id: '7', iniciales: 'LB', activo: true });
  });

  it('credenciales incorrectas no se confunden con una sesión caducada', async () => {
    const caducada = vi.fn();
    alCaducarSesion(caducada);
    document.cookie = 'csrftoken=abc';
    servidor(() => json({ detail: 'Correo o contraseña incorrectos.' }, 401));

    await expect(auth.iniciarSesion('x@intec.edu.do', 'mala')).rejects.toMatchObject({
      codigo: 'NO_AUTENTICADO',
      message: 'Correo o contraseña incorrectos.',
    });
    expect(caducada).not.toHaveBeenCalled();
  });

  it('con JWT guarda los tokens y los envía', async () => {
    vi.stubEnv('VITE_API_AUTH', 'jwt');
    servidor((ruta) =>
      ruta === '/auth/token/' ? json({ access: 'A1', refresh: 'R1' }) : json(usuarioDto),
    );

    await auth.iniciarSesion('l.batista@intec.edu.do', 'secreta');

    expect(leerTokens()).toEqual({ access: 'A1', refresh: 'R1' });
    expect(llamadas[1]?.url.pathname).toBe('/api/auth/yo/');
    expect(llamadas[1]?.cabeceras.get('Authorization')).toBe('Bearer A1');
  });

  it('con JWT renueva el token vencido y repite la petición una vez', async () => {
    vi.stubEnv('VITE_API_AUTH', 'jwt');
    guardarTokens({ access: 'viejo', refresh: 'R1' });
    servidor((ruta, { cabeceras }) => {
      if (ruta === '/auth/token/refresh/') return json({ access: 'nuevo' });
      return cabeceras.get('Authorization') === 'Bearer nuevo'
        ? json([usuarioDto])
        : json({ detail: 'Token vencido.' }, 401);
    });

    const lista = await new RepositorioUsuariosHttp().listar();

    expect(lista).toHaveLength(1);
    expect(leerTokens()).toEqual({ access: 'nuevo', refresh: 'R1' });
    expect(llamadas.map((l) => l.url.pathname)).toEqual([
      '/api/usuarios/',
      '/api/auth/token/refresh/',
      '/api/usuarios/',
    ]);
  });

  it('con JWT, si la renovación falla, se cierra la sesión', async () => {
    vi.stubEnv('VITE_API_AUTH', 'jwt');
    const caducada = vi.fn();
    alCaducarSesion(caducada);
    guardarTokens({ access: 'viejo', refresh: 'vencido' });
    servidor(() => json({ detail: 'Token inválido.' }, 401));

    await expect(new RepositorioUsuariosHttp().listar()).rejects.toMatchObject({
      codigo: 'NO_AUTENTICADO',
    });
    expect(caducada).toHaveBeenCalledOnce();
    expect(leerTokens()).toBeNull();
  });

  it('sin sesión vigente, el usuario actual es null', async () => {
    servidor(() => json({ detail: 'No autenticado.' }, 403));
    expect(await auth.usuarioActual()).toBeNull();
  });
});
