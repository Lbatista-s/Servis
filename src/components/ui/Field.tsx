/** Campos de formulario: etiqueta, entrada, área de texto y textos auxiliares. */

import * as LabelPrimitive from '@radix-ui/react-label';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Contexto: enlaza etiqueta, control, ayuda y error sin repetir identificadores
// ─────────────────────────────────────────────────────────────────────────────

interface ContextoCampo {
  idControl: string;
  idAyuda: string;
  idError: string;
  hayError: boolean;
}

const CampoContexto = createContext<ContextoCampo | null>(null);

function usarCampo(): ContextoCampo | null {
  return useContext(CampoContexto);
}

export interface FieldProps {
  children: ReactNode;
  className?: string;
  /** Mensaje de error; su presencia activa el estado inválido del control. */
  error?: string;
}

export function Field({ children, className, error }: FieldProps) {
  const base = useId();
  const contexto: ContextoCampo = {
    idControl: `${base}-control`,
    idAyuda: `${base}-ayuda`,
    idError: `${base}-error`,
    hayError: Boolean(error),
  };

  return (
    <CampoContexto.Provider value={contexto}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        {children}
        {error ? (
          <p id={contexto.idError} role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </CampoContexto.Provider>
  );
}

export interface FieldLabelProps {
  children: ReactNode;
  /** Añade el asterisco rojo del prototipo y marca el control como obligatorio. */
  requerido?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FieldLabel({ children, requerido, className, htmlFor }: FieldLabelProps) {
  const campo = usarCampo();
  return (
    <LabelPrimitive.Root
      htmlFor={htmlFor ?? campo?.idControl}
      className={cn('text-sm font-semibold text-ink-2', className)}
    >
      {children}
      {requerido ? (
        <>
          {' '}
          <span className="text-primary" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(obligatorio)</span>
        </>
      ) : null}
    </LabelPrimitive.Root>
  );
}

export function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  const campo = usarCampo();
  return (
    <p id={campo?.idAyuda} className={cn('text-xs text-ink-3', className)}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Controles
// ─────────────────────────────────────────────────────────────────────────────

const CLASES_CONTROL = cn(
  'w-full rounded border-[1.5px] border-line-2 bg-surface px-3 text-base text-ink',
  'outline-none transition-colors placeholder:text-ink-4',
  'focus:border-primary focus:shadow-focus-primary',
  'disabled:cursor-not-allowed disabled:bg-canvas-2 disabled:text-ink-3',
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-none',
);

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, id, ...props },
  ref,
) {
  const campo = usarCampo();
  return (
    <input
      ref={ref}
      id={id ?? campo?.idControl}
      aria-invalid={campo?.hayError || undefined}
      aria-describedby={campo?.hayError ? campo.idError : campo?.idAyuda}
      className={cn(CLASES_CONTROL, 'h-[38px]', className)}
      {...props}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, id, ...props },
  ref,
) {
  const campo = usarCampo();
  return (
    <textarea
      ref={ref}
      id={id ?? campo?.idControl}
      aria-invalid={campo?.hayError || undefined}
      aria-describedby={campo?.hayError ? campo.idError : campo?.idAyuda}
      className={cn(CLASES_CONTROL, 'min-h-20 resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  );
});
