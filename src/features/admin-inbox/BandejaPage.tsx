/** Pantalla 7 — Bandeja administrativa. */

import { Table, type TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  AvatarUsuario,
  Badge,
  Button,
  CampoBusqueda,
  Card,
  EmptyState,
  EsqueletoTabla,
  EstadoError,
  Icono,
  PageHeader,
  SelectorFiltro,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import type { FiltroSolicitudes } from '@/data';
import {
  ESTADOS,
  ESTADOS_FINALES,
  ETIQUETA_ESTADO,
  type EstadoSolicitud,
  type Solicitud,
} from '@/domain/types';
import { useIndiceServicios, useIndiceUsuarios, useSolicitudes } from '@/hooks/useDatos';
import { useRetardado } from '@/hooks/useRetardado';
import { descargarCsv } from '@/lib/csv';
import { opcionesConTodos, TODOS, type ConTodos } from '@/lib/filtros';
import { formatearFecha, formatearFechaLarga } from '@/lib/format';

/** Filtro de la bandeja: cualquier estado, o todas las que aún no están cerradas. */
const ABIERTAS = 'abiertas';
const ESTADOS_ABIERTOS = ESTADOS.filter((e) => !ESTADOS_FINALES.includes(e));
type FiltroEstado = ConTodos<EstadoSolicitud | typeof ABIERTAS>;

const OPCIONES_ESTADO = (() => {
  const [todos, ...estados] = opcionesConTodos('Todos los estados', ETIQUETA_ESTADO);
  return [
    { value: ABIERTAS as FiltroEstado, label: 'Abiertas' },
    ...(todos ? [todos] : []),
    ...estados,
  ];
})();

export function BandejaPage() {
  const [busqueda, setBusqueda] = useState('');
  // La bandeja es la cola de trabajo: por defecto sólo lo que sigue abierto.
  const [estado, setEstado] = useState<FiltroEstado>(ABIERTAS);
  const [servicioId, setServicioId] = useState<ConTodos<string>>(TODOS);
  const navegar = useNavigate();

  // El filtrado lo hace el servidor; la búsqueda espera a que se deje de teclear.
  const termino = useRetardado(busqueda.trim());
  const filtro = useMemo<FiltroSolicitudes>(
    () => ({
      ...(estado === ABIERTAS
        ? { estados: ESTADOS_ABIERTOS }
        : estado !== TODOS
          ? { estados: [estado] }
          : {}),
      ...(servicioId !== TODOS ? { servicioId } : {}),
      ...(termino ? { busqueda: termino } : {}),
    }),
    [estado, servicioId, termino],
  );
  const { datos: filtradas, cargando, error, recargar } = useSolicitudes(filtro);
  // Métricas sobre el total, no sobre el resultado filtrado.
  const { datos: todas } = useSolicitudes();
  const usuarios = useIndiceUsuarios();
  const servicios = useIndiceServicios();

  const lista = filtradas ?? [];
  const universo = todas ?? [];
  const cuenta = (estados: readonly EstadoSolicitud[]) =>
    universo.filter((s) => estados.includes(s.estado)).length;

  const columnas: TableColumnsType<Solicitud> = [
    {
      title: 'ID',
      dataIndex: 'id',
      render: (id: string) => <span className="font-mono text-sm text-ink-2">{id}</span>,
    },
    {
      title: 'Estudiante',
      key: 'estudiante',
      render: (_, solicitud) => {
        const estudiante = usuarios.get(solicitud.solicitanteId);
        return (
          <span className="flex items-center gap-2">
            {estudiante ? <AvatarUsuario usuario={estudiante} tamano="md" /> : null}
            <span>
              <span className="block font-medium">
                {estudiante?.nombre ?? 'Usuario desconocido'}
              </span>
              <span className="block text-xs text-ink-3">{estudiante?.carrera ?? '—'}</span>
            </span>
          </span>
        );
      },
    },
    {
      title: 'Servicio',
      key: 'servicio',
      render: (_, solicitud) => servicios.get(solicitud.servicioId)?.nombre ?? solicitud.servicioId,
    },
    {
      title: 'Recibida',
      key: 'recibida',
      render: (_, solicitud) => (
        <span className="text-ink-3">
          {formatearFecha(solicitud.enviadaEn ?? solicitud.creadaEn)}
        </span>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (valor: EstadoSolicitud) => <StatusBadge estado={valor} />,
    },
    {
      title: 'Prioridad',
      dataIndex: 'prioridad',
      render: (prioridad: Solicitud['prioridad']) => (
        <Badge tono={prioridad === 'alta' ? 'amber' : 'gray'} sinPunto>
          {prioridad === 'alta' ? 'Alta' : 'Normal'}
        </Badge>
      ),
    },
    {
      title: 'Acción',
      key: 'accion',
      render: (_, solicitud) => (
        <Button
          tamano="sm"
          onClick={(evento) => {
            evento.stopPropagation();
            navegar(RUTAS.detalleBandeja(solicitud.id));
          }}
        >
          Revisar
        </Button>
      ),
    },
  ];

  /** Exporta lo que muestra la tabla, con los filtros aplicados. */
  function exportar() {
    const encabezado = [
      'ID',
      'Estudiante',
      'Matrícula',
      'Carrera',
      'Servicio',
      'Estado',
      'Recibida',
      'Asignada a',
    ];
    const filas = lista.map((solicitud) => {
      const estudiante = usuarios.get(solicitud.solicitanteId);
      return [
        solicitud.id,
        estudiante?.nombre ?? solicitud.solicitanteId,
        estudiante?.matricula,
        estudiante?.carrera,
        servicios.get(solicitud.servicioId)?.nombre ?? solicitud.servicioId,
        ETIQUETA_ESTADO[solicitud.estado],
        formatearFecha(solicitud.enviadaEn ?? solicitud.creadaEn),
        solicitud.asignadaA ? (usuarios.get(solicitud.asignadaA)?.nombre ?? '') : '',
      ];
    });
    descargarCsv([encabezado, ...filas], 'bandeja');
  }

  return (
    <>
      <PageHeader
        titulo="Bandeja de entrada"
        subtitulo={`${formatearFechaLarga(new Date().toISOString())} — Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm" disabled={lista.length === 0} onClick={exportar}>
          <Icono nombre="descargar" />
          Exportar CSV
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard
          etiqueta="Pendientes"
          valor={cuenta(['enviada'])}
          icono="bandeja"
          fondoIcono="bg-info-light"
          tono="info"
        />
        <StatCard
          etiqueta="En revisión"
          valor={cuenta(['en_revision', 'corregida'])}
          icono="ojo"
          fondoIcono="bg-warning-light"
          tono="warning"
        />
        <StatCard
          etiqueta="Aprobadas"
          valor={cuenta(['aprobada'])}
          icono="verificar"
          fondoIcono="bg-success-light"
          tono="success"
        />
        <StatCard
          etiqueta="Rechazadas"
          valor={cuenta(['rechazada'])}
          icono="cerrar"
          fondoIcono="bg-danger-light"
          tono="danger"
        />
        <StatCard
          etiqueta="Completadas"
          valor={cuenta(['completada'])}
          icono="descargar"
          fondoIcono="bg-emerald-light"
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <CampoBusqueda
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por estudiante o ID…"
          etiqueta="Buscar por estudiante o identificador"
        />

        <SelectorFiltro
          valor={servicioId}
          onCambio={setServicioId}
          etiqueta="Filtrar por servicio"
          className="sm:w-52"
          opciones={opcionesConTodos(
            'Todos los servicios',
            new Map([...servicios.values()].map((servicio) => [servicio.id, servicio.nombre])),
          )}
        />

        <SelectorFiltro
          valor={estado}
          onCambio={setEstado}
          etiqueta="Filtrar por estado"
          className="sm:w-44"
          opciones={OPCIONES_ESTADO}
        />

        <Badge tono="gray" sinPunto>
          {lista.length} de {universo.length}
        </Badge>
      </div>

      {cargando ? (
        <EsqueletoTabla mensaje="Cargando la bandeja…" conEncabezado={false} />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="📭"
            titulo="No hay solicitudes que coincidan"
            descripcion="Ajusta los filtros o el término de búsqueda para ver más resultados."
          />
        </Card>
      ) : (
        <Card sinRelleno>
          <Table<Solicitud>
            rowKey="id"
            columns={columnas}
            dataSource={lista}
            pagination={false}
            scroll={{ x: 720 }}
            onRow={(solicitud) => ({
              onClick: () => navegar(RUTAS.detalleBandeja(solicitud.id)),
              className: 'cursor-pointer',
            })}
          />
        </Card>
      )}
    </>
  );
}
