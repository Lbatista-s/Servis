/** Utilidades de redacción en español. */

/**
 * Cantidad seguida del sustantivo en singular o plural: `1 requisito`,
 * `3 requisitos`. Por defecto el plural añade «s»; para el resto de casos
 * se indica explícitamente (`contar(2, 'solicitud', 'solicitudes')`).
 */
export function contar(cantidad: number, singular: string, plural = `${singular}s`): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
