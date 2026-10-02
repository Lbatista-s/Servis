/** Avatar con iniciales sobre el `Avatar` de Ant Design y la paleta de seis colores. */

import { Avatar as AntAvatar } from 'antd';

import type { ColorAvatar, Usuario } from '@/domain/types';
import { cn, iniciales as calcularIniciales } from '@/lib/utils';
import { cv } from '@/theme/css';

const PALETA: Record<ColorAvatar, { fondo: string; texto: string }> = {
  red: { fondo: cv('avatar.red-bg'), texto: cv('avatar.red-fg') },
  blue: { fondo: cv('avatar.blue-bg'), texto: cv('avatar.blue-fg') },
  green: { fondo: cv('avatar.green-bg'), texto: cv('avatar.green-fg') },
  amber: { fondo: cv('avatar.amber-bg'), texto: cv('avatar.amber-fg') },
  purple: { fondo: cv('avatar.purple-bg'), texto: cv('avatar.purple-fg') },
  teal: { fondo: cv('avatar.teal-bg'), texto: cv('avatar.teal-fg') },
};

/** Diámetro y tamaño de letra de cada tamaño. */
const TAMANOS = {
  xs: { lado: 16, letra: 8 },
  sm: { lado: 26, letra: 11 },
  md: { lado: 28, letra: 10 },
  lg: { lado: 32, letra: 12 },
  xl: { lado: 40, letra: 14 },
} as const;

export interface AvatarProps {
  nombre: string;
  /** Iniciales explícitas; si se omiten, se calculan a partir del nombre. */
  iniciales?: string;
  color?: ColorAvatar;
  tamano?: keyof typeof TAMANOS;
  /** URL de la fotografía, cuando exista. */
  src?: string;
  /**
   * Expone el nombre completo al lector de pantalla. Por defecto es `false`
   * porque casi siempre el nombre ya aparece escrito junto al avatar, y
   * anunciarlo de nuevo lo repetiría («Ricardo Almanzar Ricardo Almanzar»).
   * Actívalo sólo cuando el avatar sea la única referencia a la persona.
   */
  etiquetar?: boolean;
  className?: string;
}

export function Avatar({
  nombre,
  iniciales,
  color = 'blue',
  tamano = 'lg',
  src,
  etiquetar = false,
  className,
}: AvatarProps) {
  const texto = iniciales ?? calcularIniciales(nombre);
  const { lado, letra } = TAMANOS[tamano];
  const { fondo, texto: colorTexto } = PALETA[color];

  return (
    // Sin etiqueta, el avatar es puramente decorativo para el lector de pantalla.
    <span
      className={cn('inline-flex shrink-0', className)}
      aria-hidden={etiquetar ? undefined : true}
      role={etiquetar ? 'img' : undefined}
      aria-label={etiquetar ? nombre : undefined}
    >
      <AntAvatar
        size={lado}
        src={src}
        alt=""
        className="font-bold"
        style={{ background: fondo, color: colorTexto, fontSize: letra }}
      >
        {texto}
      </AntAvatar>
    </span>
  );
}

/** Avatar de un usuario del sistema, con sus iniciales y su color asignado. */
export function AvatarUsuario({
  usuario,
  ...props
}: {
  usuario: Pick<Usuario, 'nombre' | 'iniciales' | 'colorAvatar'>;
} & Omit<AvatarProps, 'nombre' | 'iniciales' | 'color'>) {
  return (
    <Avatar
      nombre={usuario.nombre}
      iniciales={usuario.iniciales}
      color={usuario.colorAvatar}
      {...props}
    />
  );
}
