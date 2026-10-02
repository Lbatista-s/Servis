/** Pantalla 10 — Gestión de usuarios. */

import { Table, type TableColumnsType } from 'antd';
import { useState } from 'react';

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
  RoleBadge,
  SelectorFiltro,
  Tooltip,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_ROL, type Rol, type Usuario } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useUsuarios } from '@/hooks/useDatos';
import { TODOS, opcionesConTodos, type ConTodos } from '@/lib/filtros';
import { tiempoRelativo } from '@/lib/format';
import { contar } from '@/lib/texto';

import { NuevoUsuarioDialog } from './NuevoUsuarioDialog';

/** Filtro por estado de la cuenta. */
const ETIQUETA_ACTIVIDAD = { activos: 'Activos', inactivos: 'Inactivos' } as const;
type FiltroActivo = ConTodos<keyof typeof ETIQUETA_ACTIVIDAD>;

export function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState<ConTodos<Rol>>(TODOS);
  const [activo, setActivo] = useState<FiltroActivo>(TODOS);

  const { datos: usuarios, cargando } = useUsuarios({
    ...(rol !== TODOS ? { rol } : {}),
    ...(activo !== TODOS ? { activo: activo === 'activos' } : {}),
    ...(busqueda ? { busqueda } : {}),
  });

  const revalidar = useRevalidar();
  const avisos = useToast();
  const lista = usuarios ?? [];

  async function alternarActivacion(usuarioId: string, nombre: string, siguiente: boolean) {
    try {
      await repositorios.usuarios.cambiarActivacion(usuarioId, siguiente);
      revalidar();
      avisos.exito(
        siguiente ? 'Usuario activado' : 'Usuario desactivado',
        `${nombre} ${siguiente ? 'puede volver a acceder' : 'ya no puede acceder'} al sistema.`,
      );
    } catch (fallo) {
      avisos.error('No se pudo actualizar el usuario', mensajeDeError(fallo));
    }
  }

  const columnas: TableColumnsType<Usuario> = [
    {
      title: 'Usuario',
      key: 'usuario',
      render: (_, usuario) => (
        <span className="flex items-center gap-2.5">
          <AvatarUsuario usuario={usuario} />
          <span className="font-medium">{usuario.nombre}</span>
        </span>
      ),
    },
    {
      title: 'Correo',
      dataIndex: 'correo',
      render: (correo: string) => <span className="text-ink-3">{correo}</span>,
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      render: (valor: Rol) => <RoleBadge rol={valor} />,
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      render: (esActivo: boolean) => (
        <Badge tono={esActivo ? 'green' : 'gray'}>{esActivo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      title: 'Último acceso',
      dataIndex: 'ultimoAcceso',
      render: (fecha: string) => <span className="text-ink-3">{tiempoRelativo(fecha)}</span>,
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, usuario) => (
        <span className="flex gap-1.5">
          <Tooltip contenido="Editar usuario">
            <Button variante="ghost" tamano="icon" aria-label={`Editar ${usuario.nombre}`}>
              <Icono nombre="editar" />
            </Button>
          </Tooltip>
          <Tooltip contenido={usuario.activo ? 'Desactivar' : 'Activar'}>
            <Button
              variante="ghost"
              tamano="icon"
              aria-label={`${usuario.activo ? 'Desactivar' : 'Activar'} ${usuario.nombre}`}
              onClick={() => alternarActivacion(usuario.id, usuario.nombre, !usuario.activo)}
            >
              <Icono nombre={usuario.activo ? 'cerrar' : 'verificar'} />
            </Button>
          </Tooltip>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Gestión de usuarios"
        subtitulo={`${contar(lista.length, 'usuario')} · Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm">
          <Icono nombre="descargar" />
          Exportar
        </Button>
        <NuevoUsuarioDialog />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <CampoBusqueda
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por nombre o correo…"
          etiqueta="Buscar usuario"
        />

        <SelectorFiltro
          valor={rol}
          onCambio={setRol}
          etiqueta="Filtrar por rol"
          className="sm:w-52"
          opciones={opcionesConTodos('Todos los roles', ETIQUETA_ROL)}
        />

        <SelectorFiltro
          valor={activo}
          onCambio={setActivo}
          etiqueta="Filtrar por estado"
          className="sm:w-44"
          opciones={opcionesConTodos('Todos los estados', ETIQUETA_ACTIVIDAD)}
        />

        <Badge tono="gray" sinPunto>
          {contar(lista.length, 'registro')}
        </Badge>
      </div>

      {cargando ? (
        <Loading mensaje="Cargando usuarios…" />
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icono="👤"
            titulo="No hay usuarios que coincidan"
            descripcion="Ajusta los filtros o el término de búsqueda."
          />
        </Card>
      ) : (
        <Card sinRelleno>
          <Table<Usuario>
            rowKey="id"
            columns={columnas}
            dataSource={lista}
            pagination={false}
            scroll={{ x: 720 }}
          />
        </Card>
      )}
    </>
  );
}
