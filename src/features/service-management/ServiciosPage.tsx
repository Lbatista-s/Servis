/**
 * Pantalla 11 — Gestión del catálogo de servicios.
 *
 * Cada servicio se publica o retira con su interruptor y se edita con el
 * lápiz: datos generales y documentos que pide, elegidos del catálogo.
 */

import { Popover, Switch, Table, type TableColumnsType } from 'antd';
import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  EsqueletoTabla,
  EstadoError,
  Icono,
  PageHeader,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_CATEGORIA, type Servicio } from '@/domain/types';
import { mensajeDeError } from '@/lib/errores';
import { useRevalidar, useServicios } from '@/hooks/useDatos';
import { contar } from '@/lib/texto';

import { EditarServicioDialog, NuevoServicioDialog } from './ServicioDialog';

export function ServiciosPage() {
  const { datos: servicios, cargando, error, recargar } = useServicios();
  const revalidar = useRevalidar();
  const avisos = useToast();
  const [procesando, setProcesando] = useState<string | null>(null);

  const lista = servicios ?? [];
  const activos = lista.filter((s) => s.activo).length;

  async function alternar(servicio: Servicio, siguiente: boolean) {
    setProcesando(servicio.id);
    try {
      await repositorios.servicios.cambiarActivacion(servicio.id, siguiente);
      revalidar('servicios');
      avisos.exito(
        siguiente ? 'Servicio activado' : 'Servicio desactivado',
        `«${servicio.nombre}» ${siguiente ? 'ya aparece' : 'dejó de aparecer'} en el catálogo.`,
      );
    } catch (fallo) {
      avisos.error('No se pudo cambiar el estado', mensajeDeError(fallo));
    } finally {
      setProcesando(null);
    }
  }

  if (cargando) return <EsqueletoTabla mensaje="Cargando el catálogo…" />;
  if (error) return <EstadoError mensaje={error} onReintentar={recargar} />;

  const columnas: TableColumnsType<Servicio> = [
    {
      title: 'Servicio',
      key: 'servicio',
      render: (_, servicio) => (
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg"
            style={{ backgroundColor: servicio.color }}
          >
            {servicio.icono}
          </span>
          <span className="font-medium">{servicio.nombre}</span>
        </span>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      render: (categoria: Servicio['categoria']) => (
        <span className="text-ink-3">{ETIQUETA_CATEGORIA[categoria]}</span>
      ),
    },
    {
      title: 'Requisitos',
      key: 'requisitos',
      render: (_, servicio) => (
        <Badge tono={servicio.requisitos.length === 0 ? 'red' : 'gray'} sinPunto>
          {contar(servicio.requisitos.length, 'requisito')}
        </Badge>
      ),
    },
    {
      title: 'Plantilla',
      dataIndex: 'plantilla',
      render: (plantilla: string) => (
        <span className="flex items-center gap-1.5 text-ink-2">
          <Icono nombre="documento" className="h-3.5 w-3.5 text-primary" />
          {plantilla || 'Pendiente'}
        </span>
      ),
    },
    {
      title: 'Activo',
      key: 'activo',
      render: (_, servicio) => (
        <Switch
          checked={servicio.activo}
          loading={procesando === servicio.id}
          onChange={(valor) => alternar(servicio, valor)}
          aria-label={`${servicio.activo ? 'Desactivar' : 'Activar'} ${servicio.nombre}`}
        />
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, servicio) => (
        <span className="flex gap-1.5">
          <EditarServicioDialog servicio={servicio} />

          <Popover
            trigger="click"
            placement="bottomRight"
            title={`Requisitos de «${servicio.nombre}»`}
            content={<ListaRequisitos servicio={servicio} />}
          >
            <Button variante="ghost" tamano="sm">
              Ver requisitos
            </Button>
          </Popover>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Gestión del catálogo"
        subtitulo={`${lista.length} servicios configurados · ${activos} activos · Plantillas y requisitos`}
      >
        <NuevoServicioDialog />
      </PageHeader>

      <Card sinRelleno>
        <Table<Servicio>
          rowKey="id"
          columns={columnas}
          dataSource={lista}
          pagination={false}
          scroll={{ x: 720 }}
        />
      </Card>
    </>
  );
}

function ListaRequisitos({ servicio }: { servicio: Servicio }) {
  if (servicio.requisitos.length === 0) {
    return (
      <p className="max-w-72 text-base text-ink-3">
        Este servicio no pide documentos: sólo los datos de su formulario.
      </p>
    );
  }
  return (
    <ul className="flex max-w-80 flex-col gap-1.5">
      {servicio.requisitos.map((requisito) => (
        <li key={requisito.id} className="flex items-start gap-2 text-base text-ink-2">
          <Icono nombre="verificar" className="mt-1 h-3 w-3 shrink-0 text-primary" />
          <span>
            {requisito.descripcion}
            {requisito.obligatorio ? null : <span className="text-ink-3"> (opcional)</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
