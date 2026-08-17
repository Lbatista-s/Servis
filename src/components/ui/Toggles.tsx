/** Casilla de verificación e interruptor, ambos sobre primitivas de Radix. */

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Icono } from './Icons';

export const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitive.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border-[1.5px] border-line-2',
        'bg-surface transition-colors outline-none',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="text-white">
        <Icono nombre="verificar" className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

/** Casilla acompañada de su etiqueta, con toda el área clicable. */
export function CheckboxField({
  id,
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
}: {
  id: string;
  checked?: boolean;
  onCheckedChange?: (marcado: boolean) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(valor) => onCheckedChange?.(valor === true)}
      />
      <label
        htmlFor={id}
        className={cn(
          'cursor-pointer text-base text-ink',
          disabled && 'cursor-not-allowed text-ink-3',
        )}
      >
        {children}
      </label>
    </div>
  );
}

export const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full',
        'bg-canvas-3 transition-colors outline-none',
        'data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'block h-3.5 w-3.5 translate-x-[3px] rounded-full bg-white shadow-s2',
          'transition-transform duration-200 data-[state=checked]:translate-x-[19px]',
        )}
      />
    </SwitchPrimitive.Root>
  );
});
