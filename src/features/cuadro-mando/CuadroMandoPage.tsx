/**
 * Cuadro de mando integral (Balanced Scorecard de Kaplan y Norton).
 *
 * Es el inicio del coordinador y una consulta para el personal administrativo.
 * La pestaña principal presenta la estrategia (misión, mapa estratégico y el
 * scorecard con metas, estado, tendencia e iniciativas); la segunda conserva el
 * análisis operativo del día a día, que Kaplan y Norton mantienen aparte.
 */

import { Segmented, Tabs } from 'antd';
import { useState } from 'react';

import {
  Button,
  Card,
  Icono,
  InlineNotification,
  Loading,
  PageHeader,
  SectionHeader,
} from '@/components/ui';
import { puedeEditarMetas } from '@/domain/businessRules';
import {
  definicionDe,
  PERIODOS,
  PERSPECTIVAS,
  type EstadoIndicador,
  type IdIndicador,
  type IdPeriodo,
  type ResultadoIndicador,
} from '@/domain/indicadores';
import { useActor } from '@/features/auth/authStore';
import { descargarBlob } from '@/lib/descargas';

import { AnalisisOperativo } from './AnalisisOperativo';
import { DetalleIndicador } from './DetalleIndicador';
import { EditarMetasDialog } from './EditarMetasDialog';
import {
  describirTendencia,
  ETIQUETA_ESTADO_INDICADOR,
  formatearMeta,
  formatearValor,
} from './formato';
import { MapaEstrategico } from './MapaEstrategico';
import { TablaIndicadores } from './TablaIndicadores';
import { useCuadroMando } from './useCuadroMando';

export function CuadroMandoPage() {
  const actor = useActor();
  const [periodo, setPeriodo] = useState<IdPeriodo>('90');
  const [elegido, setElegido] = useState<IdIndicador | null>(null);
  const [editando, setEditando] = useState(false);
  const cuadro = useCuadroMando(periodo);

  const editable = actor !== null && puedeEditarMetas(actor);
  const etiquetaPeriodo = PERIODOS.find((p) => p.id === periodo)?.etiqueta ?? '';
  const resultadoElegido = cuadro.resultados.find((r) => r.id === elegido) ?? null;

  return (
    <>
      <PageHeader
        titulo="Cuadro de mando integral"
        subtitulo="Área de Ingenierías · Estrategia medida con la metodología de Kaplan y Norton"
      >
        <Button
          variante="outline"
          tamano="sm"
          disabled={cuadro.resultados.length === 0}
          onClick={() => exportarCsv(cuadro.resultados, etiquetaPeriodo)}
        >
          <Icono nombre="descargar" />
          Exportar CSV
        </Button>
        {editable && cuadro.metas ? (
          <Button tamano="sm" onClick={() => setEditando(true)}>
            <Icono nombre="editar" />
            Editar metas
          </Button>
        ) : null}
      </PageHeader>

      <Tabs
        defaultActiveKey="estrategia"
        items={[
          {
            key: 'estrategia',
            label: 'Cuadro de mando integral',
            children: cuadro.cargando ? (
              <Loading mensaje="Calculando los indicadores…" />
            ) : cuadro.error ? (
              <InlineNotification tono="error">{cuadro.error}</InlineNotification>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Resumen resultados={cuadro.resultados} />
                  <Segmented
                    aria-label="Período de análisis"
                    value={periodo}
                    onChange={(valor) => setPeriodo(valor as IdPeriodo)}
                    options={PERIODOS.map((p) => ({ value: p.id, label: p.etiqueta }))}
                  />
                </div>

                <Card>
                  <SectionHeader titulo="Mapa estratégico" />
                  <MapaEstrategico resultados={cuadro.resultados} onElegir={setElegido} />
                </Card>

                <Card sinRelleno>
                  <div className="px-5 pt-5">
                    <SectionHeader titulo={`Indicadores · ${etiquetaPeriodo.toLowerCase()}`}>
                      <span className="text-xs text-ink-3">
                        Tendencia frente al período anterior de igual duración
                      </span>
                    </SectionHeader>
                  </div>
                  <TablaIndicadores resultados={cuadro.resultados} onElegir={setElegido} />
                </Card>
              </div>
            ),
          },
          {
            key: 'operacion',
            label: 'Análisis operativo',
            children: <AnalisisOperativo />,
          },
        ]}
      />

      <DetalleIndicador
        resultado={resultadoElegido}
        datos={cuadro.datos}
        ahora={cuadro.ahora}
        onCerrar={() => setElegido(null)}
      />

      {editable && actor && cuadro.metas ? (
        <EditarMetasDialog
          abierto={editando}
          metas={cuadro.metas}
          actor={actor}
          onCerrar={() => setEditando(false)}
        />
      ) : null}
    </>
  );
}

/** Recuento de indicadores por estado, como lectura rápida del cuadro. */
function Resumen({ resultados }: { resultados: readonly ResultadoIndicador[] }) {
  const cuenta = (estado: EstadoIndicador) => resultados.filter((r) => r.estado === estado).length;
  const partes: [EstadoIndicador, string][] = [
    ['cumple', 'cumplen su meta'],
    ['alerta', 'en alerta'],
    ['incumple', 'no cumplen'],
    ['sin_datos', 'sin datos'],
  ];
  return (
    <p className="text-base text-ink-2" aria-live="polite">
      <strong className="text-ink">{resultados.length} indicadores:</strong>{' '}
      {partes
        .filter(([estado]) => cuenta(estado) > 0)
        .map(([estado, texto]) => `${cuenta(estado)} ${texto}`)
        .join(' · ')}
    </p>
  );
}

/** Descarga el scorecard del período como CSV (UTF-8 con BOM, para Excel). */
function exportarCsv(resultados: readonly ResultadoIndicador[], periodo: string) {
  const celda = (texto: string) => `"${texto.replace(/"/g, '""')}"`;
  const encabezado = [
    'Perspectiva',
    'Objetivo',
    'Indicador',
    'Tipo',
    'Meta',
    'Actual',
    'Muestra',
    'Estado',
    'Tendencia',
    'Iniciativa',
  ];
  const filas = resultados.map((r) => {
    const d = definicionDe(r.id);
    return [
      PERSPECTIVAS.find((p) => p.id === d.perspectiva)?.nombre ?? '',
      d.objetivo,
      d.nombre,
      d.tipo === 'resultado' ? 'Resultado' : 'Inductor',
      formatearMeta(r.meta, d),
      formatearValor(r.medicion.valor, d.unidad),
      String(r.medicion.muestra),
      ETIQUETA_ESTADO_INDICADOR[r.estado],
      describirTendencia(r.tendencia, d.unidad),
      d.iniciativa,
    ];
  });
  const csv = [[`Cuadro de mando integral · ${periodo}`], encabezado, ...filas]
    .map((fila) => fila.map(celda).join(','))
    .join('\r\n');
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBlob(
    new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }),
    `cuadro-de-mando-${fecha}.csv`,
  );
}
