/** Pantalla 7 — Bandeja administrativa. */

import { Table, type TableColumnsType } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  AvatarUsuario,
  Badge,
  Button,
  Card,
  EmptyState,
  CampoBusqueda,
  Icono,
  Loading,
  PageHeader,
  SelectorFiltro,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { ETIQUETA_ESTADO, type EstadoSolicitud, type Solicitud } from '@/domain/types';
import { useIndiceServicios, useIndiceUsuarios, useSolicitudes } from '@/hooks/useDatos';
import { opcionesConTodos, TODOS, type ConTodos } from '@/lib/filtros';
import { formatearFecha, formatearFechaLarga } from '@/lib/format';

export function BandejaPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<ConTodos<EstadoSolicitud>>(TODOS);
  const [servicioId, setServicioId] = useState<ConTodos<string>>(TODOS);
  const navegar = useNavigate();

  const { datos: todas, cargando } = useSolicitudes();
  const usuarios = useIndiceUsuarios();
  const servicios = useIndiceServicios();

  const lista = (todas ?? []).filter((solicitud) => {
    if (estado !== TODOS && solicitud.estado !== estado) return false;
    if (servicioId !== TODOS && solicitud.servicioId !== servicioId) return false;
    if (busqueda.trim()) {
      const termino = busqueda.trim().toLowerCase();
      const estudiante = usuarios.get(solicitud.solicitanteId)?.nombre.toLowerCase() ?? '';
      if (!solicitud.id.toLowerCase().includes(termino) && !estudiante.includes(termino)) {
        return false;
      }
    }
    return true;
  });

  // Métricas sobre el total, no sobre el resultado filtrado.
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

  return (
    <>
      <PageHeader
        titulo="Bandeja de entrada"
        subtitulo={`${formatearFechaLarga(new Date().toISOString())} — Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm">
          <Icono nombre="descargar" />
          Exportar
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
          opciones={opcionesConTodos('Todos los estados', ETIQUETA_ESTADO)}
        />

        <Badge tono="gray" sinPunto>
          {lista.length} de {universo.length}
        </Badge>
      </div>

      {cargando ? (
        <Loading mensaje="Cargando la bandeja…" />
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
