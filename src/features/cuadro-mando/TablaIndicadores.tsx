/**
 * Cuadro de mando en forma de tabla: por perspectiva, cada objetivo con su
 * indicador, meta, valor actual, estado, tendencia e iniciativa, que son los
 * componentes que Kaplan y Norton exigen a cada línea del scorecard.
 */

import { Table, type TableColumnsType } from 'antd';

import { Badge } from '@/components/ui';
import {
  definicionDe,
  PERSPECTIVAS,
  type IdIndicador,
  type ResultadoIndicador,
} from '@/domain/indicadores';

import { EstadoIndicadorBadge } from './EstadoIndicadorBadge';
import { describirTendencia, formatearMeta, formatearValor } from './formato';

interface Fila {
  resultado: ResultadoIndicador;
  /** Filas que ocupa la celda de perspectiva (0 en las que no la muestran). */
  filasPerspectiva: number;
}

const FLECHA = { mejora: '↑', empeora: '↓', estable: '→' } as const;

export function TablaIndicadores({
  resultados,
  onElegir,
}: {
  resultados: readonly ResultadoIndicador[];
  onElegir: (id: IdIndicador) => void;
}) {
  const filas: Fila[] = PERSPECTIVAS.flatMap((perspectiva) => {
    const propios = resultados.filter((r) => definicionDe(r.id).perspectiva === perspectiva.id);
    return propios.map((resultado, indice) => ({
      resultado,
      filasPerspectiva: indice === 0 ? propios.length : 0,
    }));
  });

  const columnas: TableColumnsType<Fila> = [
    {
      title: 'Perspectiva',
      key: 'perspectiva',
      width: 150,
      onCell: (fila) => ({ rowSpan: fila.filasPerspectiva }),
      render: (_, { resultado }) => (
        <span className="font-semibold text-ink">
          {PERSPECTIVAS.find((p) => p.id === definicionDe(resultado.id).perspectiva)?.nombre}
        </span>
      ),
    },
    {
      title: 'Objetivo e indicador',
      key: 'objetivo',
      render: (_, { resultado }) => {
        const definicion = definicionDe(resultado.id);
        return (
          <button
            type="button"
            className="text-left"
            onClick={() => onElegir(resultado.id)}
            aria-label={`Ver detalle de ${definicion.objetivo}`}
          >
            <span className="block font-semibold text-ink underline-offset-2 hover:underline">
              {definicion.objetivo}
            </span>
            <span className="block text-xs text-ink-3">{definicion.nombre}</span>
          </button>
        );
      },
    },
    {
      title: 'Tipo',
      key: 'tipo',
      width: 110,
      render: (_, { resultado }) =>
        definicionDe(resultado.id).tipo === 'resultado' ? (
          <Badge tono="blue" sinPunto>
            Resultado
          </Badge>
        ) : (
          <Badge tono="gray" sinPunto>
            Inductor
          </Badge>
        ),
    },
    {
      title: 'Meta',
      key: 'meta',
      width: 110,
      render: (_, { resultado }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatearMeta(resultado.meta, definicionDe(resultado.id))}
        </span>
      ),
    },
    {
      title: 'Actual',
      key: 'actual',
      width: 120,
      render: (_, { resultado }) => (
        <span className="whitespace-nowrap">
          <span className="block font-semibold tabular-nums text-ink">
            {formatearValor(resultado.medicion.valor, definicionDe(resultado.id).unidad)}
          </span>
          <span className="block text-xs text-ink-3">n = {resultado.medicion.muestra}</span>
        </span>
      ),
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 120,
      render: (_, { resultado }) => <EstadoIndicadorBadge estado={resultado.estado} />,
    },
    {
      title: 'Tendencia',
      key: 'tendencia',
      width: 160,
      render: (_, { resultado }) => {
        const { tendencia } = resultado;
        return (
          <span className="whitespace-nowrap text-sm text-ink-2">
            {tendencia ? (
              <span aria-hidden="true" className="mr-1 font-bold">
                {FLECHA[tendencia.direccion]}
              </span>
            ) : null}
            {describirTendencia(tendencia, definicionDe(resultado.id).unidad)}
          </span>
        );
      },
    },
    {
      title: 'Iniciativa',
      key: 'iniciativa',
      render: (_, { resultado }) => (
        <span className="text-sm text-ink-2">{definicionDe(resultado.id).iniciativa}</span>
      ),
    },
  ];

  return (
    <Table<Fila>
      rowKey={(fila) => fila.resultado.id}
      columns={columnas}
      dataSource={filas}
      pagination={false}
      size="middle"
      scroll={{ x: 1000 }}
    />
  );
}
