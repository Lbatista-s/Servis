/** Pantalla 7 — Bandeja administrativa. */

import { Table, type TableColumnsType } from 'antd';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

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
import { useUsuarioActual } from '@/features/auth/authStore';
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

/** Vistas rápidas de la barra lateral (`?vista=`): fijan el estado de partida. */
type Vista = 'pendientes' | 'asignadas' | 'devueltas';
const VISTAS: Record<Vista, { titulo: string; estados: readonly EstadoSolicitud[] }> = {
  pendientes: {
    titulo: 'Pendientes de revisar',
    estados: ['enviada', 'en_revision', 'corregida'],
  },
  asignadas: { titulo: 'Asignadas a mí', estados: ESTADOS_ABIERTOS },
  devueltas: { titulo: 'Devueltas al estudiante', estados: ['devuelta'] },
};

const esVista = (valor: string | null): valor is Vista => valor !== null && valor in VISTAS;

export function BandejaPage() {
  const [parametros] = useSearchParams();
  const clave = parametros.get('vista');
  const vista = esVista(clave) ? clave : null;
  const usuario = useUsuarioActual();
  const [busqueda, setBusqueda] = useState('');
  // La bandeja es la cola de trabajo: por defecto sólo lo que sigue abierto.
  const [estado, setEstado] = useState<FiltroEstado>(ABIERTAS);
  const [servicioId, setServicioId] = useState<ConTodos<string>>(TODOS);
  const navegar = useNavigate();

  // El filtrado lo hace el servidor; la búsqueda espera a que se deje de teclear.
  const termino = useRetardado(busqueda.trim());
  const filtro = useMemo<FiltroSolicitudes>(
    () => ({
      // Con una vista activa, el estado lo decide la vista.
      ...(vista
        ? { estados: VISTAS[vista].estados }
        : estado === ABIERTAS
          ? { estados: ESTADOS_ABIERTOS }
          : estado !== TODOS
            ? { estados: [estado] }
            : {}),
      ...(vista === 'asignadas' && usuario ? { asignadaA: usuario.id } : {}),
      ...(servicioId !== TODOS ? { servicioId } : {}),
      ...(termino ? { busqueda: termino } : {}),
    }),
    [vista, usuario, estado, servicioId, termino],
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
          variante="outline"
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
        titulo={vista ? VISTAS[vista].titulo : 'Bandeja de entrada'}
        subtitulo={`${formatearFechaLarga(new Date().toISOString())} — Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm" disabled={lista.length === 0} onClick={exportar}>
          <Icono nombre="descargar" />
          Exportar CSV
        </Button>
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard etiqueta="Pendientes" valor={cuenta(['enviada'])} tono="info" />
        <StatCard
          etiqueta="En revisión"
          valor={cuenta(['en_revision', 'corregida'])}
          tono="warning"
        />
        <StatCard etiqueta="Aprobadas" valor={cuenta(['aprobada'])} tono="info" />
        <StatCard etiqueta="Rechazadas" valor={cuenta(['rechazada'])} tono="danger" />
        <StatCard etiqueta="Completadas" valor={cuenta(['completada'])} tono="success" />
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

        {vista ? (
          <Link
            to={RUTAS.bandeja}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary-light-2 bg-primary-light px-3 text-sm font-medium text-primary-dark hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Vista: {VISTAS[vista].titulo}
            <Icono nombre="cerrar" className="h-3 w-3" />
            <span className="sr-only">(quitar y ver todas)</span>
          </Link>
        ) : (
          <SelectorFiltro
            valor={estado}
            onCambio={setEstado}
            etiqueta="Filtrar por estado"
            className="sm:w-44"
            opciones={OPCIONES_ESTADO}
          />
        )}

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
            icono="bandeja"
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
