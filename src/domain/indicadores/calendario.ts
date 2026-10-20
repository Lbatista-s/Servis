/**
 * Calendario laboral para los indicadores.
 *
 * Los tiempos de servicio se prometen en días hábiles (`Servicio.diasEstimados`),
 * así que los plazos se miden igual: sin sábados ni domingos, en la hora de
 * Santo Domingo (UTC−4, sin horario de verano). No se descuentan feriados.
 */

const DIA = 24 * 60 * 60 * 1000;
const DESFASE_SANTO_DOMINGO = -4 * 60 * 60 * 1000;

/** Días hábiles (fraccionarios) transcurridos entre dos instantes. */
export function diasHabilesEntre(desde: Date | string, hasta: Date | string): number {
  const inicio = new Date(desde).getTime() + DESFASE_SANTO_DOMINGO;
  const fin = new Date(hasta).getTime() + DESFASE_SANTO_DOMINGO;
  if (!(fin > inicio)) return 0;

  let total = 0;
  let cursor = inicio;
  while (cursor < fin) {
    const inicioDia = Math.floor(cursor / DIA) * DIA;
    const tramo = Math.min(inicioDia + DIA, fin);
    const diaSemana = new Date(inicioDia).getUTCDay();
    if (diaSemana !== 0 && diaSemana !== 6) total += tramo - cursor;
    cursor = tramo;
  }
  return total / DIA;
}

export function restarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() - dias * DIA);
}

/** Avanza `dias` hábiles (fraccionarios) desde una fecha, saltando los fines de semana. */
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  let restante = Math.max(0, dias) * DIA;
  let cursor = desde.getTime() + DESFASE_SANTO_DOMINGO;
  for (let vueltas = 0; vueltas < 10_000; vueltas += 1) {
    const inicioDia = Math.floor(cursor / DIA) * DIA;
    const diaSemana = new Date(inicioDia).getUTCDay();
    if (diaSemana === 0 || diaSemana === 6) {
      cursor = inicioDia + DIA;
      continue;
    }
    const disponible = inicioDia + DIA - cursor;
    if (restante <= disponible) return new Date(cursor + restante - DESFASE_SANTO_DOMINGO);
    restante -= disponible;
    cursor = inicioDia + DIA;
  }
  return new Date(cursor - DESFASE_SANTO_DOMINGO);
}
