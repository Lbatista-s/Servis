/**
 * Conversión de claves entre el JSON de Django (`snake_case`) y el dominio
 * (`camelCase`).
 *
 * Sólo se convierten las claves, nunca los valores: los estados (`en_revision`)
 * y los roles (`personal_administrativo`) ya viajan igual en ambos lados.
 */

/**
 * Claves cuyo contenido se deja intacto: son nombres de campos dinámicos del
 * formulario de cada servicio y deben conservarse tal cual.
 */
const CLAVES_OPACAS = new Set(['datos_formulario', 'datosFormulario']);

export function aCamel(clave: string): string {
  return clave.replace(/_([a-z0-9])/g, (_, letra: string) => letra.toUpperCase());
}

export function aSnake(clave: string): string {
  return clave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
}

function esObjetoPlano(valor: unknown): valor is Record<string, unknown> {
  return Object.prototype.toString.call(valor) === '[object Object]';
}

function convertir(valor: unknown, clave: (texto: string) => string): unknown {
  if (Array.isArray(valor)) return valor.map((item) => convertir(item, clave));
  if (!esObjetoPlano(valor)) return valor;
  return Object.fromEntries(
    Object.entries(valor).map(([nombre, contenido]) => [
      clave(nombre),
      CLAVES_OPACAS.has(nombre) ? contenido : convertir(contenido, clave),
    ]),
  );
}

export const clavesACamel = (valor: unknown): unknown => convertir(valor, aCamel);
export const clavesASnake = (valor: unknown): unknown => convertir(valor, aSnake);
