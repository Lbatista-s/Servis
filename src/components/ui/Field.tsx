/**
 * Campos de formulario: etiqueta, entrada, área de texto y textos auxiliares.
 *
 * Los controles son `Input` e `Input.TextArea` de Ant Design. `Field` sigue
 * enlazando etiqueta, control, ayuda y error mediante un contexto, de modo que
 * la accesibilidad no depende de que cada pantalla repita identificadores.
 *
 * Con React Hook Form los controles se usan a través de `Controller`: los de
 * Ant Design son controlados y no admiten que el formulario escriba en el DOM.
 */

import {
  DatePicker,
  Input as AntInput,
  type GetProps,
  type GetRef,
  type InputProps as AntInputProps,
  type InputRef,
} from 'antd';
import dayjs from 'dayjs';
import { createContext, forwardRef, useContext, useId, type ReactNode } from 'react';

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

function useCampo(): ContextoCampo | null {
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
  /** Añade el asterisco del prototipo y lo anuncia como obligatorio. */
  requerido?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FieldLabel({ children, requerido, className, htmlFor }: FieldLabelProps) {
  const campo = useCampo();
  return (
    <label
      htmlFor={htmlFor ?? campo?.idControl}
      className={cn('text-sm font-semibold text-ink-2', className)}
    >
      {children}
      {requerido ? (
        <>
          {' '}
          <span className="text-primary-dark" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(obligatorio)</span>
        </>
      ) : null}
    </label>
  );
}

export function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  const campo = useCampo();
  return (
    <p id={campo?.idAyuda} className={cn('text-xs text-ink-3', className)}>
      {children}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Controles
// ─────────────────────────────────────────────────────────────────────────────

/** Atributos de accesibilidad y estado que el contexto aporta a cada control. */
function useAtributosControl(id: string | undefined) {
  const campo = useCampo();
  return {
    id: id ?? campo?.idControl,
    status: campo?.hayError ? ('error' as const) : undefined,
    'aria-invalid': campo?.hayError || undefined,
    'aria-describedby': campo?.hayError ? campo.idError : campo?.idAyuda,
  };
}

export type InputProps = AntInputProps;

export const Input = forwardRef<InputRef, InputProps>(function Input({ id, ...props }, ref) {
  return <AntInput ref={ref} {...useAtributosControl(id)} {...props} />;
});

/** Formato en que el dominio guarda las fechas (el mismo del control nativo). */
const FORMATO_GUARDADO = 'YYYY-MM-DD';

/**
 * Selector de fecha. Recibe y entrega cadenas `AAAA-MM-DD`, de modo que el
 * dominio no depende de la librería de fechas; al usuario le muestra DD/MM/AAAA.
 */
export function DateInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'DD/MM/AAAA',
}: {
  id?: string;
  value: string | undefined;
  onChange: (valor: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  const { status, id: idControl } = useAtributosControl(id);
  // `AAAA-MM-DD` es ISO 8601: dayjs lo interpreta sin plugins de formato.
  const fecha = value ? dayjs(value) : null;
  return (
    <DatePicker
      id={idControl}
      status={status}
      className="w-full"
      format="DD/MM/YYYY"
      placeholder={placeholder}
      value={fecha?.isValid() ? fecha : null}
      onChange={(nueva) => onChange(nueva ? nueva.format(FORMATO_GUARDADO) : '')}
      onBlur={onBlur}
    />
  );
}

export type TextareaProps = GetProps<typeof AntInput.TextArea>;

export const Textarea = forwardRef<GetRef<typeof AntInput.TextArea>, TextareaProps>(
  function Textarea({ id, autoSize = { minRows: 3, maxRows: 10 }, ...props }, ref) {
    return (
      <AntInput.TextArea ref={ref} autoSize={autoSize} {...useAtributosControl(id)} {...props} />
    );
  },
);
