/** Pantalla 7 — Bandeja administrativa. */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { RUTAS } from '@/app/rutas';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icono,
  Input,
  Loading,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StatCard,
  StatusBadge,
  Table,
  TableWrapper,
  Tbody,
  Td,
  TdMono,
  Th,
  Thead,
  Tr,
} from '@/components/ui';
import { ESTADOS, ETIQUETA_ESTADO, type EstadoSolicitud } from '@/domain/types';
import { useIndiceServicios, useIndiceUsuarios, useSolicitudes } from '@/hooks/useDatos';
import { formatearFecha, formatearFechaLarga } from '@/lib/format';

const TODOS = 'todos';

export function BandejaPage() {
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<EstadoSolicitud | typeof TODOS>(TODOS);
  const [servicioId, setServicioId] = useState<string>(TODOS);
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
          colorValor="text-info"
        />
        <StatCard
          etiqueta="En revisión"
          valor={cuenta(['en_revision', 'corregida'])}
          icono="ojo"
          fondoIcono="bg-warning-light"
          colorValor="text-warning"
        />
        <StatCard
          etiqueta="Aprobadas"
          valor={cuenta(['aprobada'])}
          icono="verificar"
          fondoIcono="bg-success-light"
          colorValor="text-success"
        />
        <StatCard
          etiqueta="Rechazadas"
          valor={cuenta(['rechazada'])}
          icono="cerrar"
          fondoIcono="bg-danger-light"
          colorValor="text-danger"
        />
        <StatCard
          etiqueta="Completadas"
          valor={cuenta(['completada'])}
          icono="descargar"
          fondoIcono="bg-emerald-light"
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Icono
            nombre="buscar"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <Input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por estudiante o ID…"
            aria-label="Buscar por estudiante o identificador"
            className="pl-[38px]"
          />
        </div>

        <Select value={servicioId} onValueChange={setServicioId}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por servicio">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los servicios</SelectItem>
            {[...servicios.values()].map((servicio) => (
              <SelectItem key={servicio.id} value={servicio.id}>
                {servicio.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={estado}
          onValueChange={(valor) => setEstado(valor as EstadoSolicitud | typeof TODOS)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los estados</SelectItem>
            {ESTADOS.map((clave) => (
              <SelectItem key={clave} value={clave}>
                {ETIQUETA_ESTADO[clave]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge tono="gray" sinPunto className="px-2.5 py-1.5 text-sm">
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
          <TableWrapper>
            <Table>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Estudiante</Th>
                  <Th>Servicio</Th>
                  <Th>Recibida</Th>
                  <Th>Estado</Th>
                  <Th>Prioridad</Th>
                  <Th>Acción</Th>
                </Tr>
              </Thead>
              <Tbody>
                {lista.map((solicitud) => {
                  const estudiante = usuarios.get(solicitud.solicitanteId);
                  const servicio = servicios.get(solicitud.servicioId);
                  const alta = solicitud.prioridad === 'alta';

                  return (
                    <Tr
                      key={solicitud.id}
                      onClick={() => navegar(RUTAS.detalleBandeja(solicitud.id))}
                    >
                      <TdMono>{solicitud.id}</TdMono>
                      <Td>
                        <span className="flex items-center gap-2">
                          {estudiante ? (
                            <Avatar
                              nombre={estudiante.nombre}
                              iniciales={estudiante.iniciales}
                              color={estudiante.colorAvatar}
                              tamano="md"
                            />
                          ) : null}
                          <span>
                            <span className="block font-medium">
                              {estudiante?.nombre ?? 'Usuario desconocido'}
                            </span>
                            <span className="block text-xs text-ink-3">
                              {estudiante?.carrera ?? '—'}
                            </span>
                          </span>
                        </span>
                      </Td>
                      <Td>{servicio?.nombre ?? solicitud.servicioId}</Td>
                      <Td className="text-ink-3">
                        {formatearFecha(solicitud.enviadaEn ?? solicitud.creadaEn)}
                      </Td>
                      <Td>
                        <StatusBadge estado={solicitud.estado} />
                      </Td>
                      <Td>
                        <Badge tono={alta ? 'amber' : 'gray'} sinPunto>
                          {alta ? 'Alta' : 'Normal'}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          tamano="sm"
                          onClick={(evento) => {
                            evento.stopPropagation();
                            navegar(RUTAS.detalleBandeja(solicitud.id));
                          }}
                        >
                          Revisar
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableWrapper>
        </Card>
      )}
    </>
  );
}
