/** Botón del sistema, con las seis variantes y cuatro tamaños del prototipo. */

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const variantesBoton = cva(
  cn(
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded',
    'border-[1.5px] border-transparent font-semibold transition-all duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0',
  ),
  {
    variants: {
      variante: {
        primary: 'border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover',
        success: 'border-success bg-success text-white hover:bg-success-hover hover:border-success-hover',
        danger: 'border-danger bg-danger text-white hover:bg-danger-hover hover:border-danger-hover',
        warning: 'border-warning bg-warning text-white hover:bg-warning-hover hover:border-warning-hover',
        outline: 'border-line-2 bg-transparent text-ink hover:border-ink-4 hover:bg-canvas',
        ghost: 'border-transparent bg-transparent text-ink-2 hover:bg-canvas',
      },
      tamano: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-[9px] text-base',
        lg: 'px-[22px] py-[11px] text-lg',
        icon: 'h-[34px] w-[34px] p-2',
      },
    },
    defaultVariants: {
      variante: 'primary',
      tamano: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {
  /** Renderiza el hijo directo en lugar de un `<button>` (por ejemplo, un enlace). */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variante, tamano, asChild = false, type, ...props },
  ref,
) {
  const Componente = asChild ? Slot : 'button';
  return (
    <Componente
      ref={ref}
      // Evita envíos accidentales cuando el botón vive dentro de un formulario.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(variantesBoton({ variante, tamano }), className)}
      {...props}
    />
  );
});

export { variantesBoton };
