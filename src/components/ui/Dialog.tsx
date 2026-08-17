/** Diálogo modal con la animación y el cromado del prototipo. */

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Icono } from './Icons';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { anchoMaximo?: string }
>(function DialogContent({ className, children, anchoMaximo = 'max-w-[480px]', ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px]',
          'data-[state=open]:animate-overlay-in',
        )}
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl bg-surface p-7 shadow-s5',
          'data-[state=open]:animate-modal-in',
          anchoMaximo,
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Cerrar"
          className={cn(
            'absolute right-7 top-7 flex h-7 w-7 items-center justify-center rounded-sm',
            'bg-canvas text-ink-3 transition-colors hover:bg-canvas-2 hover:text-ink',
          )}
        >
          <Icono nombre="cerrar" className="h-3.5 w-3.5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export function DialogHeader({
  titulo,
  descripcion,
  className,
}: {
  titulo: ReactNode;
  descripcion?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 pr-9', className)}>
      <DialogPrimitive.Title className="text-2xl font-bold text-ink">
        {titulo}
      </DialogPrimitive.Title>
      {descripcion ? (
        <DialogPrimitive.Description className="mt-1 text-base text-ink-3">
          {descripcion}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)}>{children}</div>;
}
