/** Reglas de validación de Zod reutilizadas por varios formularios. */

import { z } from 'zod';

/** Dominio de las cuentas institucionales del INTEC. */
export const DOMINIO_INSTITUCIONAL = '@intec.edu.do';

/** Ejemplo que muestran los campos de correo institucional. */
export const EJEMPLO_CORREO = `tu.nombre${DOMINIO_INSTITUCIONAL}`;

export function esCorreoInstitucional(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
}

/**
 * Correo obligatorio, con formato válido y del dominio institucional. Los
 * mensajes se pueden ajustar al tono de cada pantalla (tú / impersonal).
 */
export function correoInstitucional({
  requerido = 'Indica tu correo institucional.',
  dominio = `Debes usar tu correo institucional del INTEC (${DOMINIO_INSTITUCIONAL}).`,
}: { requerido?: string; dominio?: string } = {}) {
  return z
    .string()
    .min(1, requerido)
    .email('El formato del correo no es válido.')
    .refine(esCorreoInstitucional, { message: dominio });
}
