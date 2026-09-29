/** Pantalla 10 — Gestión de usuarios. */

import { Select, Table, type TableColumnsType } from 'antd';
import { useState } from 'react';

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
  RoleBadge,
  Tooltip,
  useToast,
} from '@/components/ui';
import { repositorios } from '@/data';
import { ETIQUETA_ROL, ROLES, type Rol, type Usuario } from '@/domain/types';
import { mensajeDeError } from '@/hooks/useAsync';
import { useRevalidar, useUsuarios } from '@/hooks/useDatos';
import { tiempoRelativo } from '@/lib/format';

import { NuevoUsuarioDialog } from './NuevoUsuarioDialog';

const TODOS = 'todos';
type FiltroActivo = 'todos' | 'activos' | 'inactivos';

export function UsuariosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState<Rol | typeof TODOS>(TODOS);
  const [activo, setActivo] = useState<FiltroActivo>(TODOS);

  const { datos: usuarios, cargando } = useUsuarios({
    ...(rol !== TODOS ? { rol } : {}),
    ...(activo !== 'todos' ? { activo: activo === 'activos' } : {}),
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
          <Avatar
            nombre={usuario.nombre}
            iniciales={usuario.iniciales}
            color={usuario.colorAvatar}
          />
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
        subtitulo={`${lista.length} usuario${lista.length === 1 ? '' : 's'} · Área de Ingenierías`}
      >
        <Button variante="outline" tamano="sm">
          <Icono nombre="descargar" />
          Exportar
        </Button>
        <NuevoUsuarioDialog />
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <Input
            type="search"
            allowClear
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre o correo…"
            aria-label="Buscar usuario"
            prefix={<Icono nombre="buscar" className="text-ink-3" />}
          />
        </div>

        <Select
          value={rol}
          onChange={(valor: Rol | typeof TODOS) => setRol(valor)}
          aria-label="Filtrar por rol"
          className="w-full sm:w-52"
          options={[
            { value: TODOS, label: 'Todos los roles' },
            ...ROLES.map((clave) => ({ value: clave, label: ETIQUETA_ROL[clave] })),
          ]}
        />

        <Select
          value={activo}
          onChange={(valor: FiltroActivo) => setActivo(valor)}
          aria-label="Filtrar por estado"
          className="w-full sm:w-44"
          options={[
            { value: 'todos', label: 'Todos los estados' },
            { value: 'activos', label: 'Activos' },
            { value: 'inactivos', label: 'Inactivos' },
          ]}
        />

        <Badge tono="gray" sinPunto>
          {lista.length} registro{lista.length === 1 ? '' : 's'}
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
