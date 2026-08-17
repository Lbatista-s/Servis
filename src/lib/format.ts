/** Utilidades de formato en español dominicano, usadas en toda la interfaz. */

const FORMATO_FECHA = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Santo_Domingo',
});

const FORMATO_FECHA_LARGA = new Intl.DateTimeFormat('es-DO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Santo_Domingo',
});

const FORMATO_HORA = new Intl.DateTimeFormat('es-DO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Santo_Domingo',
});

/** `02/07/2026` */
export function formatearFecha(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}

/** `9 de julio de 2026` */
export function formatearFechaLarga(iso: string): string {
  return FORMATO_FECHA_LARGA.format(new Date(iso));
}

/** `02/07/2026 · 09:14` */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  return `${FORMATO_FECHA.format(fecha)} · ${FORMATO_HORA.format(fecha)}`;
}

/** `342 KB` */
export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `Hace 2 horas`, `Ayer`, `Hace 3 días`… */
export function tiempoRelativo(iso: string, referencia: Date = new Date()): string {
  const transcurrido = referencia.getTime() - new Date(iso).getTime();
  const minutos = Math.floor(transcurrido / 60_000);

  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} minuto${minutos === 1 ? '' : 's'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} hora${horas === 1 ? '' : 's'}`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Ayer';
  if (dias < 30) return `Hace ${dias} días`;

  const meses = Math.floor(dias / 30);
  return `Hace ${meses} mes${meses === 1 ? '' : 'es'}`;
}
