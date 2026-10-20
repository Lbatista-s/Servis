/**
 * Cliente HTTP de la API de SERVIS (Django REST Framework).
 *
 * Resuelve en un solo lugar lo que ningún repositorio debería repetir:
 * - la URL base y los parámetros de consulta;
 * - la autenticación (cookie de sesión con CSRF, o JWT con renovación);
 * - la conversión `snake_case` ↔ `camelCase` de las claves;
 * - la paginación de DRF;
 * - la traducción de los errores al `ErrorRepositorio` del dominio.
 */

import { ErrorRepositorio, type CodigoErrorRepositorio } from '@/data/repositories/types';

import { clavesACamel, clavesASnake } from './casos';
import { modoAutenticacion, urlBase } from './config';
import { API } from './rutas';
import { guardarTokens, leerCookie, leerTokens, notificarSesionCaducada } from './sesion';

export type ValorConsulta = string | number | boolean | readonly string[] | null | undefined;
export type Consulta = Record<string, ValorConsulta>;

export interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Objeto (se envía como JSON en `snake_case`) o `FormData` (multipart). */
  cuerpo?: unknown;
  consulta?: Consulta;
  /** `json` (por defecto), `blob` para archivos o `nada` si no hay cuerpo. */
  respuesta?: 'json' | 'blob' | 'nada';
  /**
   * `false` en las rutas de inicio de sesión: un 401 ahí significa
   * credenciales incorrectas, no una sesión caducada.
   */
  sesionRequerida?: boolean;
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

function construirUrl(ruta: string, consulta?: Consulta): string {
  const parametros = new URLSearchParams();
  for (const [nombre, valor] of Object.entries(consulta ?? {})) {
    if (valor === undefined || valor === null || valor === '') continue;
    if (Array.isArray(valor)) {
      for (const item of valor) parametros.append(nombre, item);
    } else {
      parametros.append(nombre, String(valor));
    }
  }
  const texto = parametros.toString();
  return `${urlBase()}/${ruta.replace(/^\/+/, '')}${texto ? `?${texto}` : ''}`;
}

function codigoDesdeEstado(estado: number): CodigoErrorRepositorio {
  if (estado === 401) return 'NO_AUTENTICADO';
  if (estado === 403) return 'PROHIBIDO';
  if (estado === 404) return 'NO_ENCONTRADO';
  if (estado === 409) return 'CONFLICTO';
  if (estado >= 500) return 'ERROR_RED';
  return 'REGLA_DE_NEGOCIO';
}

const MENSAJE_POR_CODIGO: Partial<Record<CodigoErrorRepositorio, string>> = {
  NO_AUTENTICADO: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  PROHIBIDO: 'No tienes permiso para realizar esta acción.',
  NO_ENCONTRADO: 'No se encontró el recurso solicitado.',
  ERROR_RED: 'El servidor no pudo procesar la petición. Inténtalo más tarde.',
};

/**
 * Mensaje legible a partir del cuerpo de error de DRF: `{"detail": "…"}`,
 * `{"non_field_errors": ["…"]}` o errores por campo `{"correo": ["…"]}`.
 */
export function mensajeDeCuerpo(cuerpo: unknown): string | null {
  if (typeof cuerpo === 'string') return cuerpo.trim() || null;
  if (Array.isArray(cuerpo)) return mensajeDeCuerpo(cuerpo[0]);
  if (typeof cuerpo !== 'object' || cuerpo === null) return null;

  const objeto = cuerpo as Record<string, unknown>;
  for (const clave of ['detail', 'mensaje', 'non_field_errors']) {
    const mensaje = mensajeDeCuerpo(objeto[clave]);
    if (mensaje) return mensaje;
  }
  for (const [campo, valor] of Object.entries(objeto)) {
    const mensaje = mensajeDeCuerpo(valor);
    if (mensaje) return `${campo}: ${mensaje}`;
  }
  return null;
}

async function errorDesdeRespuesta(respuesta: Response): Promise<ErrorRepositorio> {
  const codigo = codigoDesdeEstado(respuesta.status);
  let cuerpo: unknown = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    // El cuerpo no era JSON (p. ej. la página de error de un proxy).
  }
  const mensaje =
    (respuesta.status < 500 ? mensajeDeCuerpo(cuerpo) : null) ??
    MENSAJE_POR_CODIGO[codigo] ??
    `La petición falló con estado ${respuesta.status}.`;
  return new ErrorRepositorio(codigo, mensaje);
}

function cabeceras(metodo: string, cuerpo: unknown): Headers {
  const resultado = new Headers({ Accept: 'application/json' });
  if (cuerpo !== undefined && !(cuerpo instanceof FormData)) {
    resultado.set('Content-Type', 'application/json');
  }

  if (modoAutenticacion() === 'jwt') {
    const tokens = leerTokens();
    if (tokens) resultado.set('Authorization', `Bearer ${tokens.access}`);
  } else if (!METODOS_SEGUROS.has(metodo)) {
    // Django exige el token CSRF en toda petición que modifica datos.
    const csrf = leerCookie('csrftoken');
    if (csrf) resultado.set('X-CSRFToken', csrf);
  }
  return resultado;
}

async function enviar(ruta: string, opciones: OpcionesPeticion): Promise<Response> {
  const metodo = opciones.metodo ?? 'GET';
  const { cuerpo } = opciones;
  try {
    return await fetch(construirUrl(ruta, opciones.consulta), {
      method: metodo,
      headers: cabeceras(metodo, cuerpo),
      credentials: 'include',
      body:
        cuerpo === undefined
          ? undefined
          : cuerpo instanceof FormData
            ? cuerpo
            : JSON.stringify(clavesASnake(cuerpo)),
    });
  } catch {
    throw new ErrorRepositorio(
      'ERROR_RED',
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  }
}

/** Pide un token de acceso nuevo con el de renovación. Devuelve si lo logró. */
async function renovarJwt(): Promise<boolean> {
  const tokens = leerTokens();
  if (!tokens) return false;
  const respuesta = await enviar(API.auth.renovar, {
    metodo: 'POST',
    cuerpo: { refresh: tokens.refresh },
  });
  if (!respuesta.ok) return false;
  const nuevos = (await respuesta.json()) as { access: string; refresh?: string };
  guardarTokens({ access: nuevos.access, refresh: nuevos.refresh ?? tokens.refresh });
  return true;
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const sesionRequerida = opciones.sesionRequerida ?? true;
  let respuesta = await enviar(ruta, opciones);

  // Con JWT, un 401 suele ser un token de acceso vencido: se renueva una vez.
  if (
    respuesta.status === 401 &&
    sesionRequerida &&
    modoAutenticacion() === 'jwt' &&
    (await renovarJwt())
  ) {
    respuesta = await enviar(ruta, opciones);
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && sesionRequerida) {
      guardarTokens(null);
      notificarSesionCaducada();
    }
    throw await errorDesdeRespuesta(respuesta);
  }

  if (opciones.respuesta === 'nada' || respuesta.status === 204) return undefined as T;
  if (opciones.respuesta === 'blob') return (await respuesta.blob()) as T;
  return clavesACamel(await respuesta.json()) as T;
}

interface Pagina {
  results: unknown[];
  next: string | null;
}

function esPagina(valor: unknown): valor is Pagina {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    Array.isArray((valor as Pagina).results) &&
    'next' in valor
  );
}

/**
 * Lista completa de un recurso. Acepta un arreglo o la respuesta paginada de
 * DRF (`{count, next, previous, results}`) y recorre todas las páginas.
 *
 * De `next` sólo se toman los parámetros: la URL absoluta que genera Django
 * apunta a su propio host, que detrás del proxy no es el de la página.
 */
export async function lista<T>(ruta: string, consulta: Consulta = {}): Promise<T[]> {
  const elementos: T[] = [];
  let parametros: Consulta = consulta;

  for (;;) {
    const respuesta = await peticion<unknown>(ruta, { consulta: parametros });
    if (Array.isArray(respuesta)) return respuesta as T[];
    if (!esPagina(respuesta)) {
      throw new ErrorRepositorio('ERROR_RED', `Respuesta inesperada del servidor en ${ruta}.`);
    }
    elementos.push(...(respuesta.results as T[]));
    if (!respuesta.next) return elementos;
    const siguiente = new URL(respuesta.next, 'http://x').searchParams;
    // `getAll` conserva los parámetros repetidos (`?estado=a&estado=b`).
    parametros = Object.fromEntries(
      [...new Set(siguiente.keys())].map((nombre) => {
        const valores = siguiente.getAll(nombre);
        return [nombre, valores.length === 1 ? valores[0] : valores];
      }),
    );
  }
}

/** Obtiene un recurso, o `null` si el servidor responde 404. */
export async function detalleOpcional<T>(ruta: string): Promise<T | null> {
  try {
    return await peticion<T>(ruta);
  } catch (error) {
    if (error instanceof ErrorRepositorio && error.codigo === 'NO_ENCONTRADO') return null;
    throw error;
  }
}

/** Error uniforme para lo que la API no ofrece. */
export function noImplementado(metodo: string): never {
  throw new ErrorRepositorio(
    'NO_IMPLEMENTADO',
    `La API no ofrece «${metodo}». Esta acción sólo existe en el modo de demostración.`,
  );
}
