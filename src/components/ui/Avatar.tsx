/** Avatar con iniciales, sobre la paleta de seis colores del prototipo. */

import * as AvatarPrimitive from '@radix-ui/react-avatar';

import type { ColorAvatar } from '@/domain/types';
import { cn, iniciales as calcularIniciales } from '@/lib/utils';

const PALETA: Record<ColorAvatar, string> = {
  red: 'bg-avatar-red-bg text-avatar-red-fg',
  blue: 'bg-avatar-blue-bg text-avatar-blue-fg',
  green: 'bg-avatar-green-bg text-avatar-green-fg',
  amber: 'bg-avatar-amber-bg text-avatar-amber-fg',
  purple: 'bg-avatar-purple-bg text-avatar-purple-fg',
  teal: 'bg-avatar-teal-bg text-avatar-teal-fg',
};

const TAMANOS = {
  xs: 'h-4 w-4 text-[8px]',
  sm: 'h-[26px] w-[26px] text-xs',
  md: 'h-7 w-7 text-2xs',
  lg: 'h-8 w-8 text-sm',
  xl: 'h-10 w-10 text-md',
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

  return (
    <AvatarPrimitive.Root
      // Sin etiqueta, el avatar es puramente decorativo: las iniciales no
      // aportan nada a quien no ve la pantalla.
      aria-hidden={etiquetar ? undefined : true}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        TAMANOS[tamano],
        PALETA[color],
        className,
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt={etiquetar ? nombre : ''}
          className="h-full w-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-bold leading-none"
        delayMs={src ? 300 : 0}
      >
        <span aria-hidden="true">{texto}</span>
        {etiquetar ? <span className="sr-only">{nombre}</span> : null}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
