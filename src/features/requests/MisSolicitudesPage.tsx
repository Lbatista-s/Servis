/**
 * Mis solicitudes: todos los trámites del estudiante, con búsqueda y filtro
 * por estado.
 *
 * Filtra en el navegador sobre la misma consulta que el inicio (caché
 * compartida): la lista de un estudiante es corta y así la búsqueda también
 * encuentra por nombre de servicio, que la API no indexa.
 */

import { useState } from 'react';

import { RUTAS } from '@/app/rutas';
import {
  Badge,
  ButtonLink,
  CampoBusqueda,
  Card,
  EmptyState,
  EsqueletoTabla,
  EstadoError,
  Icono,
  PageHeader,
  SelectorFiltro,
} from '@/components/ui';
import { ETIQUETA_ESTADO, type EstadoSolicitud } from '@/domain/types';
import { useUsuarioActual } from '@/features/auth/authStore';
import { useIndiceServicios, useSolicitudes } from '@/hooks/useDatos';
import { opcionesConTodos, TODOS, type ConTodos } from '@/lib/filtros';
import { contar } from '@/lib/texto';

import { ACCION_PENDIENTE } from './accionPendiente';
import { FilaSolicitud } from './FilaSolicitud';

export function MisSolicitudesPage() {
  const usuario = useUsuarioActual();
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<ConTodos<EstadoSolicitud>>(TODOS);
  const {
    datos: solicitudes,
    cargando,
    error,
    recargar,
  } = useSolicitudes({ solicitanteId: usuario?.id });
  const servicios = useIndiceServicios();

  const nombreServicio = (id: string) => servicios.get(id)?.nombre ?? id;
  const termino = busqueda.trim().toLowerCase();
  const todas = solicitudes ?? [];
  const lista = todas.filter(
    (s) =>
      (estado === TODOS || s.estado === estado) &&
      (!termino ||
        s.id.toLowerCase().includes(termino) ||
        nombreServicio(s.servicioId).toLowerCase().includes(termino)),
  );

  return (
    <>
      <PageHeader
        titulo="Mis solicitudes"
        subtitulo="Todos tus trámites, del más reciente al más antiguo."
      >
        <ButtonLink to={RUTAS.catalogo}>
          <Icono nombre="mas" />
          Nueva solicitud
        </ButtonLink>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <CampoBusqueda
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por servicio o ID…"
          etiqueta="Buscar en mis solicitudes"
        />
        <SelectorFiltro
          valor={estado}
          onCambio={setEstado}
          etiqueta="Filtrar por estado"
          className="sm:w-48"
          opciones={opcionesConTodos('Todos los estados', ETIQUETA_ESTADO)}
        />
        <Badge tono="gray" sinPunto>
          {lista.length} de {contar(todas.length, 'solicitud', 'solicitudes')}
        </Badge>
      </div>

      {cargando ? (
        <EsqueletoTabla mensaje="Cargando tus solicitudes…" conEncabezado={false} />
      ) : error ? (
        <EstadoError mensaje={error} onReintentar={recargar} />
      ) : todas.length === 0 ? (
        <Card>
          <EmptyState
            icono="📄"
            titulo="Todavía no tienes solicitudes"
            descripcion="Explora el catálogo y elige el servicio que necesitas tramitar."
          >
            <ButtonLink to={RUTAS.catalogo}>Ver catálogo de servicios</ButtonLink>
          </EmptyState>
        </Card>
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="🔍"
            titulo="Ninguna solicitud coincide"
            descripcion="Prueba con otro término o cambia el estado seleccionado."
          />
        </Card>
      ) : (
        <Card sinRelleno>
          <ul aria-label="Mis solicitudes">
            {lista.map((solicitud) => (
              <li key={solicitud.id}>
                <FilaSolicitud
                  solicitud={solicitud}
                  icono={servicios.get(solicitud.servicioId)?.icono ?? '📄'}
                  nombreServicio={nombreServicio(solicitud.servicioId)}
                  accion={ACCION_PENDIENTE[solicitud.estado]}
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
