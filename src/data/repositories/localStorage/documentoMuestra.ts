/**
 * Documento de salida de muestra, generado en el navegador.
 *
 * En producción el documento oficial lo genera el backend al completar la
 * solicitud. En modo local no hay servidor, así que se compone aquí un PDF con
 * los datos reales de la solicitud y una marca visible de que no tiene validez,
 * para que la demostración recorra el flujo completo.
 *
 * `jsPDF` se importa bajo demanda: sólo se descarga al pedir un documento.
 */

import type { jsPDF as Pdf } from 'jspdf';

import type { Servicio, Solicitud, Usuario } from '@/domain/types';
import { camposDe, formatearValorCampo } from '@/features/requests/formularios';
import { formatearFechaLarga } from '@/lib/format';
import { COLORES_MARCA } from '@/theme/tokens';

interface DatosDocumento {
  solicitud: Solicitud;
  servicio: Servicio | undefined;
  solicitante: Usuario | undefined;
}

const MARGEN = 72;
const GRIS = '#63666A';

export async function generarDocumentoMuestra({
  solicitud,
  servicio,
  solicitante,
}: DatosDocumento): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const ancho = pdf.internal.pageSize.getWidth();
  const alto = pdf.internal.pageSize.getHeight();
  const util = ancho - MARGEN * 2;
  const fecha = formatearFechaLarga(solicitud.documento?.generadoEn ?? solicitud.actualizadaEn);
  const nombreServicio = servicio?.nombre ?? solicitud.servicioId;

  pdf.setProperties({
    title: `${nombreServicio} — ${solicitud.id} (muestra)`,
    creator: 'SERVIS',
  });

  // Marca de agua diagonal.
  pdf.setTextColor('#EDEDED');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(110);
  pdf.text('MUESTRA', ancho / 2, alto / 2 + 60, { align: 'center', angle: 35 });

  // Membrete.
  pdf.setFillColor(COLORES_MARCA.rojo);
  pdf.rect(0, 0, ancho, 8, 'F');
  pdf.setTextColor('#000000');
  pdf.setFontSize(12);
  pdf.text('INSTITUTO TECNOLÓGICO DE SANTO DOMINGO', MARGEN, 64);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(GRIS);
  pdf.text('Área de Ingenierías · SERVIS', MARGEN, 80);
  pdf.setDrawColor(COLORES_MARCA.rojo);
  pdf.setLineWidth(1.2);
  pdf.line(MARGEN, 92, ancho - MARGEN, 92);

  let y = 130;
  pdf.setTextColor('#000000');
  pdf.setFontSize(11);
  pdf.text(`Santo Domingo, D. N., ${fecha}`, ancho - MARGEN, y, { align: 'right' });

  y += 44;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(nombreServicio.toUpperCase(), ancho / 2, y, { align: 'center' });

  y += 40;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('A quien pueda interesar:', MARGEN, y);

  const estudiante = solicitante
    ? [
        solicitante.nombre,
        solicitante.matricula ? `matrícula ${solicitante.matricula}` : null,
        solicitante.carrera ? `estudiante de ${solicitante.carrera}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : 'el solicitante';
  const cuerpo =
    `Por medio de la presente, el Área de Ingenierías del Instituto Tecnológico de Santo ` +
    `Domingo (INTEC) hace constar que ${estudiante}, gestionó el servicio «${nombreServicio}» ` +
    `mediante la solicitud ${solicitud.id}, que fue revisada y completada el ${fecha}.`;

  y += 24;
  y = parrafo(pdf, cuerpo, y, util);

  const datos = camposDe(solicitud.servicioId)
    .map((campo) => [
      campo.etiqueta,
      formatearValorCampo(campo, solicitud.datosFormulario[campo.nombre]),
    ])
    .filter(([, valor]) => valor !== '');
  if (datos.length > 0) {
    y += 18;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos de la solicitud', MARGEN, y);
    pdf.setFont('helvetica', 'normal');
    y += 18;
    for (const [etiqueta, valor] of datos) {
      y = parrafo(pdf, `${etiqueta}: ${valor}`, y, util, 16);
    }
  }

  y += 18;
  y = parrafo(
    pdf,
    'Se expide la presente a solicitud de la parte interesada, para los fines que estime convenientes.',
    y,
    util,
  );

  // Firma.
  const yFirma = Math.max(y + 80, alto - 210);
  pdf.setDrawColor('#000000');
  pdf.setLineWidth(0.6);
  pdf.line(MARGEN, yFirma, MARGEN + 220, yFirma);
  pdf.text('Área de Ingenierías', MARGEN, yFirma + 16);
  pdf.setTextColor(GRIS);
  pdf.text('Instituto Tecnológico de Santo Domingo', MARGEN, yFirma + 30);

  // Aviso de muestra.
  pdf.setFillColor('#FFEAE6');
  pdf.rect(MARGEN, alto - 110, util, 44, 'F');
  pdf.setTextColor(COLORES_MARCA.vino);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('DOCUMENTO DE MUESTRA — SIN VALIDEZ OFICIAL', MARGEN + 12, alto - 92);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Generado por SERVIS en modo demostración. Referencia ${solicitud.id}.`,
    MARGEN + 12,
    alto - 78,
  );

  return pdf.output('blob');
}

/** Escribe un párrafo con ajuste de línea y devuelve la nueva posición vertical. */
function parrafo(pdf: Pdf, texto: string, y: number, ancho: number, interlineado = 17): number {
  const lineas = pdf.splitTextToSize(texto, ancho) as string[];
  pdf.text(lineas, MARGEN, y);
  return y + lineas.length * interlineado;
}
