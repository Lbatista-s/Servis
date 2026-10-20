/**
 * API simulada de SERVIS (Mock Service Worker).
 *
 * Responde los mismos endpoints que documenta `docs/api.md`, con el mismo
 * formato que Django REST Framework (`snake_case`, paginación, `detail` en los
 * errores), para que la aplicación use siempre su capa HTTP real. Las reglas de
 * negocio se aplican con el propio dominio, como haría el servidor.
 *
 * Se activa con `VITE_API_MOCK=true` hasta que exista el backend.
 */

import { http, HttpResponse, type JsonBodyType } from 'msw';

import { clavesACamel, clavesASnake } from '@/data/repositories/http/casos';
import {
  aplicarTransicion,
  puedeEditarMetas,
  validarActivacionServicio,
  validarEdicion,
} from '@/domain/businessRules';
import { crearDocumento } from '@/domain/documentos';
import type { Metas } from '@/domain/indicadores/definiciones';
import {
  COLORES_AVATAR,
  type Actor,
  type Adjunto,
  type EstadoSolicitud,
  type Rol,
  type Servicio,
  type Solicitud,
  type Usuario,
} from '@/domain/types';

import {
  baseSimulada,
  CONTRASENA_SIMULADA,
  guardarArchivo,
  guardarBase,
  leerArchivo,
} from './base';
import { marcarLeidas, notificacionesDe } from './notificaciones';

/** Cualquier origen: el navegador usa `/api`, las pruebas una URL absoluta. */
const ruta = (camino: string) => `*/api/${camino}`;

const TAMANO_PAGINA = 100;
const PERSONAL: readonly Rol[] = ['personal_administrativo', 'coordinador'];

// ─────────────────────────────────────────────────────────────────────────────
// Respuestas
// ─────────────────────────────────────────────────────────────────────────────

const respuesta = (dato: unknown, status = 200) =>
  HttpResponse.json(clavesASnake(dato) as JsonBodyType, { status });

const error = (status: number, detail: string) => HttpResponse.json({ detail }, { status });

const sinContenido = () => new HttpResponse(null, { status: 204 });

const archivo = (contenido: Blob, tipo: string) =>
  new HttpResponse(contenido, { headers: { 'Content-Type': tipo } });

async function cuerpo<T>(request: Request): Promise<Partial<T>> {
  try {
    return clavesACamel(await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

/** Paginación de DRF: `{count, next, previous, results}`. */
function paginar(request: Request, elementos: readonly unknown[]) {
  const url = new URL(request.url);
  const pagina = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const enlace = (numero: number) => {
    const destino = new URL(url);
    destino.searchParams.set('page', String(numero));
    return destino.toString();
  };
  return respuesta({
    count: elementos.length,
    next: pagina * TAMANO_PAGINA < elementos.length ? enlace(pagina + 1) : null,
    previous: pagina > 1 ? enlace(pagina - 1) : null,
    results: elementos.slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Sesión
// ─────────────────────────────────────────────────────────────────────────────

const PREFIJO_TOKEN = 'simulado.';

/** Usuario de la petición: token JWT simulado o la sesión abierta. */
function usuarioDe(request: Request): Usuario | null {
  const base = baseSimulada();
  const cabecera = request.headers.get('Authorization') ?? '';
  const id = cabecera.startsWith(`Bearer ${PREFIJO_TOKEN}`)
    ? cabecera.slice(`Bearer ${PREFIJO_TOKEN}`.length)
    : base.sesion;
  return base.usuarios.find((u) => u.id === id && u.activo) ?? null;
}

const actorDe = (usuario: Usuario): Actor => ({
  id: usuario.id,
  nombre: usuario.nombre,
  rol: usuario.rol,
});

interface Contexto {
  request: Request;
  params: Record<string, string>;
  usuario: Usuario;
  actor: Actor;
}

/** Envuelve un manejador que exige sesión (401 si no la hay). */
function protegido(manejador: (contexto: Contexto) => Response | Promise<Response>) {
  return ({ request, params }: { request: Request; params: Record<string, unknown> }) => {
    const usuario = usuarioDe(request);
    if (!usuario) return error(401, 'Las credenciales de autenticación no se proveyeron.');
    return manejador({
      request,
      params: params as Record<string, string>,
      usuario,
      actor: actorDe(usuario),
    });
  };
}

/** Comprueba credenciales; devuelve el usuario o la respuesta de error. */
async function autenticar(request: Request): Promise<Usuario | Response> {
  const { correo = '', contrasena = '' } = await cuerpo<{ correo: string; contrasena: string }>(
    request,
  );
  const usuario = baseSimulada().usuarios.find(
    (u) => u.correo.toLowerCase() === correo.trim().toLowerCase(),
  );
  if (!usuario || contrasena !== CONTRASENA_SIMULADA) {
    return error(401, 'Correo o contraseña incorrectos.');
  }
  if (!usuario.activo) {
    return error(401, 'Esta cuenta está desactivada. Contacta al administrador del sistema.');
  }
  usuario.ultimoAcceso = new Date().toISOString();
  return usuario;
}

// ─────────────────────────────────────────────────────────────────────────────
// Solicitudes
// ─────────────────────────────────────────────────────────────────────────────

/** Un estudiante sólo ve sus solicitudes y nunca el comentario interno. */
function visibles(usuario: Usuario): Solicitud[] {
  const { solicitudes } = baseSimulada();
  return usuario.rol === 'estudiante'
    ? solicitudes.filter((s) => s.solicitanteId === usuario.id)
    : solicitudes;
}

const paraUsuario = (solicitud: Solicitud, usuario: Usuario): Solicitud =>
  usuario.rol === 'estudiante' ? { ...solicitud, comentarioInterno: '' } : solicitud;

function buscarSolicitud(usuario: Usuario, id: string): Solicitud | undefined {
  return visibles(usuario).find((s) => s.id === id);
}

function reemplazar(solicitud: Solicitud): void {
  const base = baseSimulada();
  base.solicitudes = base.solicitudes.map((s) => (s.id === solicitud.id ? solicitud : s));
  guardarBase();
}

/** Siguiente identificador correlativo (`SRV-1043`…). */
function siguienteId(): string {
  const maximo = baseSimulada().solicitudes.reduce((acumulado, s) => {
    const numero = Number.parseInt(s.id.replace('SRV-', ''), 10);
    return Number.isNaN(numero) ? acumulado : Math.max(acumulado, numero);
  }, 1034);
  return `SRV-${maximo + 1}`;
}

const nuevoId = (prefijo: string) =>
  `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const handlersNotificaciones = [
  http.get(
    ruta('notificaciones/'),
    protegido(({ request, usuario }) => {
      const soloNoLeidas = new URL(request.url).searchParams.get('no_leidas') === 'true';
      const avisos = notificacionesDe(baseSimulada(), usuario).filter(
        (n) => !soloNoLeidas || !n.leida,
      );
      return paginar(request, avisos);
    }),
  ),

  http.post(
    ruta('notificaciones/leer-todas/'),
    protegido(({ usuario }) => {
      const base = baseSimulada();
      marcarLeidas(
        base,
        usuario.id,
        notificacionesDe(base, usuario).map((n) => n.id),
      );
      guardarBase();
      return sinContenido();
    }),
  ),

  http.post(
    ruta('notificaciones/:id/leida/'),
    protegido(({ params, usuario }) => {
      const base = baseSimulada();
      const id = String(params.id);
      if (!notificacionesDe(base, usuario).some((n) => n.id === id)) {
        return error(404, 'No encontrado.');
      }
      marcarLeidas(base, usuario.id, [id]);
      guardarBase();
      return sinContenido();
    }),
  ),
];

const handlersSolicitudes = [
  http.get(
    ruta('solicitudes/'),
    protegido(({ request, usuario }) => {
      const consulta = new URL(request.url).searchParams;
      const estados = consulta.getAll('estado') as EstadoSolicitud[];
      const solicitante = consulta.get('solicitante');
      const servicio = consulta.get('servicio');
      const termino = consulta.get('search')?.trim().toLowerCase() ?? '';
      const { usuarios } = baseSimulada();

      const lista = visibles(usuario)
        .filter((s) => !solicitante || s.solicitanteId === solicitante)
        .filter((s) => estados.length === 0 || estados.includes(s.estado))
        .filter((s) => !servicio || s.servicioId === servicio)
        .filter((s) => {
          if (!termino) return true;
          const nombre = usuarios.find((u) => u.id === s.solicitanteId)?.nombre ?? '';
          return s.id.toLowerCase().includes(termino) || nombre.toLowerCase().includes(termino);
        })
        .sort((a, b) => b.creadaEn.localeCompare(a.creadaEn))
        .map((s) => paraUsuario(s, usuario));
      return paginar(request, lista);
    }),
  ),

  http.post(
    ruta('solicitudes/'),
    protegido(async ({ request, usuario, actor }) => {
      if (usuario.rol !== 'estudiante') {
        return error(403, 'Sólo un estudiante puede crear solicitudes.');
      }
      const datos = await cuerpo<{ servicioId: string; datosFormulario: Record<string, string> }>(
        request,
      );
      if (!baseSimulada().servicios.some((s) => s.id === datos.servicioId && s.activo)) {
        return HttpResponse.json(
          { servicio_id: ['El servicio no existe o no está activo.'] },
          { status: 400 },
        );
      }
      const ahora = new Date().toISOString();
      const id = siguienteId();
      const solicitud: Solicitud = {
        id,
        servicioId: datos.servicioId ?? '',
        solicitanteId: usuario.id,
        estado: 'borrador',
        creadaEn: ahora,
        actualizadaEn: ahora,
        enviadaEn: null,
        datosFormulario: datos.datosFormulario ?? {},
        adjuntos: [],
        historial: [
          {
            id: `${id}-h0`,
            solicitudId: id,
            autorId: actor.id,
            autorNombre: actor.nombre,
            fecha: ahora,
            estadoAnterior: null,
            estadoNuevo: 'borrador',
            comentario: null,
          },
        ],
        comentarioInterno: '',
        asignadaA: null,
        prioridad: 'normal',
        documento: null,
      };
      baseSimulada().solicitudes.unshift(solicitud);
      guardarBase();
      return respuesta(solicitud, 201);
    }),
  ),

  http.get(
    ruta('solicitudes/:id/'),
    protegido(({ params, usuario }) => {
      const solicitud = buscarSolicitud(usuario, params.id ?? '');
      return solicitud ? respuesta(paraUsuario(solicitud, usuario)) : error(404, 'No encontrado.');
    }),
  ),

  http.patch(
    ruta('solicitudes/:id/'),
    protegido(async ({ request, params, usuario, actor }) => {
      const actual = buscarSolicitud(usuario, params.id ?? '');
      if (!actual) return error(404, 'No encontrado.');
      const permitido = validarEdicion(actual, actor);
      if (!permitido.ok) return error(400, permitido.error.mensaje);

      const cambios = await cuerpo<Solicitud>(request);
      const esPersonal = PERSONAL.includes(usuario.rol);
      const actualizada: Solicitud = {
        ...actual,
        ...(cambios.datosFormulario !== undefined && usuario.rol === 'estudiante'
          ? { datosFormulario: cambios.datosFormulario }
          : {}),
        ...(cambios.comentarioInterno !== undefined && esPersonal
          ? { comentarioInterno: cambios.comentarioInterno }
          : {}),
        ...(cambios.asignadaA !== undefined && esPersonal ? { asignadaA: cambios.asignadaA } : {}),
        actualizadaEn: new Date().toISOString(),
      };
      reemplazar(actualizada);
      return respuesta(paraUsuario(actualizada, usuario));
    }),
  ),

  http.delete(
    ruta('solicitudes/:id/'),
    protegido(({ params, usuario, actor }) => {
      const actual = buscarSolicitud(usuario, params.id ?? '');
      if (!actual) return error(404, 'No encontrado.');
      const permitido = validarEdicion(actual, actor);
      if (!permitido.ok) return error(400, permitido.error.mensaje);
      const base = baseSimulada();
      base.solicitudes = base.solicitudes.filter((s) => s.id !== actual.id);
      guardarBase();
      return sinContenido();
    }),
  ),

  http.post(
    ruta('solicitudes/:id/transiciones/'),
    protegido(async ({ request, params, usuario, actor }) => {
      const actual = buscarSolicitud(usuario, params.id ?? '');
      if (!actual) return error(404, 'No encontrado.');
      const { hacia, comentario } = await cuerpo<{ hacia: EstadoSolicitud; comentario: string }>(
        request,
      );
      if (!hacia)
        return HttpResponse.json({ hacia: ['Este campo es obligatorio.'] }, { status: 400 });

      const ahora = new Date();
      const resultado = aplicarTransicion(actual, hacia, actor, {
        comentario: comentario ?? undefined,
        ahora,
        generarId: () => `${actual.id}-h${actual.historial.length}`,
      });
      if (!resultado.ok) return error(400, resultado.error.mensaje);

      let siguiente = resultado.valor;
      // Quien toma la solicitud en revisión queda asignado.
      if (hacia === 'en_revision') siguiente = { ...siguiente, asignadaA: actor.id };
      // Al completar, el servidor emite el documento de salida.
      if (hacia === 'completada') {
        const servicio = baseSimulada().servicios.find((s) => s.id === actual.servicioId);
        siguiente = {
          ...siguiente,
          documento: crearDocumento(actual.id, servicio?.nombre ?? actual.servicioId, ahora),
        };
      }
      reemplazar(siguiente);
      return respuesta(paraUsuario(siguiente, usuario));
    }),
  ),

  http.post(
    ruta('solicitudes/:id/adjuntos/'),
    protegido(async ({ request, params, usuario, actor }) => {
      const actual = buscarSolicitud(usuario, params.id ?? '');
      if (!actual) return error(404, 'No encontrado.');
      const permitido = validarEdicion(actual, actor);
      if (!permitido.ok) return error(400, permitido.error.mensaje);

      const formulario = await request.formData();
      const contenido = formulario.get('archivo');
      if (!(contenido instanceof Blob)) {
        return HttpResponse.json({ archivo: ['No se envió ningún archivo.'] }, { status: 400 });
      }
      const adjunto: Adjunto = {
        id: nuevoId('adj'),
        nombre: contenido instanceof File ? contenido.name : 'archivo',
        tamano: contenido.size,
        tipo: contenido.type || 'application/octet-stream',
        subidoEn: new Date().toISOString(),
      };
      guardarArchivo(adjunto.id, contenido);
      reemplazar({ ...actual, adjuntos: [...actual.adjuntos, adjunto] });
      return respuesta(adjunto, 201);
    }),
  ),

  http.delete(
    ruta('solicitudes/:id/adjuntos/:adjunto/'),
    protegido(({ params, usuario, actor }) => {
      const actual = buscarSolicitud(usuario, params.id ?? '');
      if (!actual) return error(404, 'No encontrado.');
      const permitido = validarEdicion(actual, actor);
      if (!permitido.ok) return error(400, permitido.error.mensaje);
      reemplazar({ ...actual, adjuntos: actual.adjuntos.filter((a) => a.id !== params.adjunto) });
      return sinContenido();
    }),
  ),

  http.get(
    ruta('solicitudes/:id/adjuntos/:adjunto/archivo/'),
    protegido(async ({ params, usuario }) => {
      const adjunto = buscarSolicitud(usuario, params.id ?? '')?.adjuntos.find(
        (a) => a.id === params.adjunto,
      );
      if (!adjunto) return error(404, 'No encontrado.');
      const guardado = leerArchivo(adjunto.id);
      if (guardado) return archivo(guardado, adjunto.tipo);
      // Los adjuntos de los datos iniciales (o subidos antes de recargar la
      // página) no tienen contenido: se entrega un PDF de ejemplo.
      if (adjunto.tipo !== 'application/pdf') {
        return error(404, 'El contenido de este archivo ya no está disponible.');
      }
      const { generarAdjuntoMuestra } = await import('./documentoMuestra');
      return archivo(await generarAdjuntoMuestra(adjunto.nombre), 'application/pdf');
    }),
  ),

  http.get(
    ruta('solicitudes/:id/documento/'),
    protegido(async ({ params, usuario }) => {
      const solicitud = buscarSolicitud(usuario, params.id ?? '');
      if (!solicitud) return error(404, 'No encontrado.');
      if (!solicitud.documento) return error(404, 'La solicitud no está completada.');
      const { servicios, usuarios } = baseSimulada();
      const { generarDocumentoMuestra } = await import('./documentoMuestra');
      const pdf = await generarDocumentoMuestra({
        solicitud,
        servicio: servicios.find((s) => s.id === solicitud.servicioId),
        solicitante: usuarios.find((u) => u.id === solicitud.solicitanteId),
      });
      return archivo(pdf, 'application/pdf');
    }),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Usuarios
// ─────────────────────────────────────────────────────────────────────────────

const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

const puedeVerUsuarios = (usuario: Usuario) => usuario.rol !== 'estudiante';

const handlersUsuarios = [
  http.get(
    ruta('usuarios/'),
    protegido(({ request, usuario }) => {
      if (!puedeVerUsuarios(usuario)) return error(403, 'No tiene permiso para ver los usuarios.');
      const consulta = new URL(request.url).searchParams;
      const rol = consulta.get('rol');
      const activo = consulta.get('activo');
      const correo = consulta.get('correo')?.toLowerCase();
      const termino = consulta.get('search')?.trim().toLowerCase() ?? '';
      const lista = baseSimulada()
        .usuarios.filter((u) => !rol || u.rol === rol)
        .filter((u) => activo === null || u.activo === (activo === 'true'))
        .filter((u) => !correo || u.correo.toLowerCase() === correo)
        .filter(
          (u) =>
            !termino ||
            u.nombre.toLowerCase().includes(termino) ||
            u.correo.toLowerCase().includes(termino),
        );
      return paginar(request, lista);
    }),
  ),

  http.get(
    ruta('usuarios/:id/'),
    protegido(({ params, usuario }) => {
      if (params.id !== usuario.id && !puedeVerUsuarios(usuario)) {
        return error(403, 'No tiene permiso para ver este usuario.');
      }
      const encontrado = baseSimulada().usuarios.find((u) => u.id === params.id);
      return encontrado ? respuesta(encontrado) : error(404, 'No encontrado.');
    }),
  ),

  http.post(
    ruta('usuarios/'),
    protegido(async ({ request, usuario }) => {
      if (usuario.rol !== 'administrador')
        return error(403, 'Sólo el administrador crea usuarios.');
      const datos = await cuerpo<Usuario>(request);
      const correo = datos.correo?.trim() ?? '';
      const base = baseSimulada();
      if (base.usuarios.some((u) => u.correo.toLowerCase() === correo.toLowerCase())) {
        return error(409, `Ya existe un usuario con el correo ${correo}.`);
      }
      const nombre = datos.nombre?.trim() ?? '';
      const creado: Usuario = {
        id: nuevoId('usr'),
        nombre,
        correo,
        rol: datos.rol ?? 'estudiante',
        iniciales: iniciales(nombre),
        colorAvatar: COLORES_AVATAR[base.usuarios.length % COLORES_AVATAR.length] ?? 'blue',
        activo: datos.activo ?? true,
        matricula: datos.matricula,
        carrera: datos.carrera,
        semestre: datos.semestre,
        ultimoAcceso: new Date().toISOString(),
      };
      base.usuarios.push(creado);
      guardarBase();
      return respuesta(creado, 201);
    }),
  ),

  http.patch(
    ruta('usuarios/:id/'),
    protegido(async ({ request, params, usuario }) => {
      if (usuario.rol !== 'administrador') {
        return error(403, 'Sólo el administrador modifica usuarios.');
      }
      const base = baseSimulada();
      const actual = base.usuarios.find((u) => u.id === params.id);
      if (!actual) return error(404, 'No encontrado.');
      Object.assign(actual, await cuerpo<Usuario>(request), { id: actual.id });
      guardarBase();
      return respuesta(actual);
    }),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Servicios
// ─────────────────────────────────────────────────────────────────────────────

/** `Carta de pasantía` → `carta-de-pasantia`: la clave del servicio. */
const claveDe = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const handlersServicios = [
  // El catálogo es público: la pantalla de acceso muestra cuántos servicios hay.
  http.get(ruta('servicios/'), ({ request }) => {
    const consulta = new URL(request.url).searchParams;
    const activo = consulta.get('activo');
    const categoria = consulta.get('categoria');
    const termino = consulta.get('search')?.trim().toLowerCase() ?? '';
    const lista = baseSimulada()
      .servicios.filter((s) => activo === null || s.activo === (activo === 'true'))
      .filter((s) => !categoria || s.categoria === categoria)
      .filter(
        (s) =>
          !termino ||
          s.nombre.toLowerCase().includes(termino) ||
          s.descripcion.toLowerCase().includes(termino),
      );
    return paginar(request, lista);
  }),

  http.get(ruta('servicios/:id/'), ({ params }) => {
    const servicio = baseSimulada().servicios.find((s) => s.id === params.id);
    return servicio ? respuesta(servicio) : error(404, 'No encontrado.');
  }),

  http.post(
    ruta('servicios/'),
    protegido(async ({ request, usuario }) => {
      if (usuario.rol !== 'administrador') {
        return error(403, 'Sólo el administrador gestiona el catálogo.');
      }
      const datos = await cuerpo<Servicio>(request);
      const servicio: Servicio = {
        id: claveDe(datos.nombre ?? ''),
        nombre: datos.nombre?.trim() ?? '',
        descripcion: datos.descripcion ?? '',
        icono: datos.icono ?? '📄',
        color: datos.color ?? 'bg-canvas',
        categoria: datos.categoria ?? 'administrativo',
        requisitos: (datos.requisitos ?? []).map((r, i) => ({
          ...r,
          id: r.id || `${claveDe(datos.nombre ?? '')}-r${i + 1}`,
        })),
        plantilla: datos.plantilla ?? '',
        activo: datos.activo ?? false,
        diasEstimados: datos.diasEstimados ?? 5,
      };
      if (!servicio.id) {
        return HttpResponse.json({ nombre: ['Este campo es obligatorio.'] }, { status: 400 });
      }
      const validacion = validarActivacionServicio(servicio, servicio.activo);
      if (!validacion.ok) return error(400, validacion.error.mensaje);
      const base = baseSimulada();
      if (base.servicios.some((s) => s.id === servicio.id)) {
        return error(409, `Ya existe un servicio con el nombre «${servicio.nombre}».`);
      }
      base.servicios.push(validacion.valor);
      guardarBase();
      return respuesta(validacion.valor, 201);
    }),
  ),

  http.patch(
    ruta('servicios/:id/'),
    protegido(async ({ request, params, usuario }) => {
      if (usuario.rol !== 'administrador') {
        return error(403, 'Sólo el administrador gestiona el catálogo.');
      }
      const base = baseSimulada();
      const indice = base.servicios.findIndex((s) => s.id === params.id);
      const actual = base.servicios[indice];
      if (!actual) return error(404, 'No encontrado.');
      const siguiente: Servicio = {
        ...actual,
        ...(await cuerpo<Servicio>(request)),
        id: actual.id,
      };
      // Quitar todos los requisitos a un servicio activo, o activarlo sin
      // ellos, viola la regla del catálogo.
      const validacion = validarActivacionServicio(siguiente, siguiente.activo);
      if (!validacion.ok) return error(400, validacion.error.mensaje);
      base.servicios[indice] = validacion.valor;
      guardarBase();
      return respuesta(validacion.valor);
    }),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Autenticación y metas
// ─────────────────────────────────────────────────────────────────────────────

const handlersAuth = [
  http.get(ruta('auth/csrf/'), () => sinContenido()),

  http.post(ruta('auth/login/'), async ({ request }) => {
    const resultado = await autenticar(request);
    if (resultado instanceof Response) return resultado;
    baseSimulada().sesion = resultado.id;
    guardarBase();
    return respuesta(resultado);
  }),

  http.post(ruta('auth/logout/'), () => {
    baseSimulada().sesion = null;
    guardarBase();
    return sinContenido();
  }),

  // Sin servidor de correo: responde lo mismo que el real, exista o no la
  // cuenta, y no envía nada.
  http.post(ruta('auth/recuperar/'), async ({ request }) => {
    const { correo } = await cuerpo<{ correo?: string }>(request);
    if (!correo?.trim()) {
      return HttpResponse.json({ correo: ['Este campo es obligatorio.'] }, { status: 400 });
    }
    return sinContenido();
  }),

  http.get(
    ruta('auth/yo/'),
    protegido(({ usuario }) => respuesta(usuario)),
  ),

  http.post(ruta('auth/token/'), async ({ request }) => {
    const resultado = await autenticar(request);
    if (resultado instanceof Response) return resultado;
    guardarBase();
    return respuesta({
      access: `${PREFIJO_TOKEN}${resultado.id}`,
      refresh: `${PREFIJO_TOKEN}${resultado.id}`,
    });
  }),

  http.post(ruta('auth/token/refresh/'), async ({ request }) => {
    const { refresh = '' } = await cuerpo<{ refresh: string }>(request);
    return refresh.startsWith(PREFIJO_TOKEN)
      ? respuesta({ access: refresh })
      : error(401, 'El token no es válido.');
  }),
];

const handlersMetas = [
  http.get(
    ruta('indicadores/metas/'),
    protegido(() => respuesta(baseSimulada().metas)),
  ),

  http.put(
    ruta('indicadores/metas/'),
    protegido(async ({ request, actor }) => {
      if (!puedeEditarMetas(actor))
        return error(403, 'Sólo el coordinador puede cambiar las metas.');
      const base = baseSimulada();
      base.metas = { ...base.metas, ...(await cuerpo<Metas>(request)) };
      guardarBase();
      return respuesta(base.metas);
    }),
  ),
];

export const handlers = [
  ...handlersAuth,
  ...handlersSolicitudes,
  ...handlersUsuarios,
  ...handlersServicios,
  ...handlersMetas,
  ...handlersNotificaciones,
];
