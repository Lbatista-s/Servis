/**
 * Tabla de datos del prototipo.
 *
 * En pantallas estrechas la tabla se desplaza horizontalmente dentro de su
 * propio contenedor, de modo que la página nunca desborda.
 */

import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function TableWrapper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('w-full overflow-x-auto', className)}>{children}</div>;
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full min-w-[720px] border-collapse', className)} {...props} />;
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function Tbody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        '[&:last-child>td]:border-b-0',
        props.onClick && 'cursor-pointer',
        '[&:hover>td]:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b-[1.5px] border-line bg-surface-2 px-3.5 py-2.5 text-left',
        'text-xs font-semibold uppercase tracking-wider text-ink-3',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        'border-b border-line px-3.5 py-3 text-base text-ink transition-colors',
        className,
      )}
      {...props}
    />
  );
}

/** Celda monoespaciada para identificadores (`SRV-1042`). */
export function TdMono({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <Td className={cn('font-mono text-sm text-ink-2', className)} {...props} />;
}
