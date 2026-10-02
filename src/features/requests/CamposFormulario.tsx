/**
 * Renderizado de los campos dinámicos de un servicio.
 *
 * Lo comparten la creación de una solicitud y la corrección posterior, de modo
 * que ambos formularios se ven y validan igual sin duplicar el marcado.
 */

import { Controller, type UseFormReturn } from 'react-hook-form';

import {
  Card,
  DateInput,
  Field,
  FieldLabel,
  Input,
  SectionHeader,
  Textarea,
} from '@/components/ui';
import { cn } from '@/lib/utils';

import { agruparPorSeccion, type CampoFormulario } from './formularios';

/** Tipo de control HTML que corresponde a cada tipo de campo del dominio. */
const TIPO_HTML: Record<CampoFormulario['tipo'], string> = {
  texto: 'text',
  fecha: 'date',
  correo: 'email',
  telefono: 'tel',
  area: 'text',
};

export interface CamposFormularioProps {
  campos: readonly CampoFormulario[];
  formulario: UseFormReturn<Record<string, string>>;
  /** Envuelve cada sección en su propia tarjeta. Desactívalo si ya hay una. */
  conTarjetas?: boolean;
  className?: string;
}

export function CamposFormulario({
  campos,
  formulario,
  conTarjetas = true,
  className,
}: CamposFormularioProps) {
  const grupos = agruparPorSeccion(campos);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {grupos.map((grupo) => {
        const contenido = (
          <div className="grid gap-4 sm:grid-cols-2">
            {grupo.campos.map((campo) => (
              <Field
                key={campo.nombre}
                error={formulario.formState.errors[campo.nombre]?.message as string | undefined}
                className={cn(campo.anchoCompleto && 'sm:col-span-2')}
              >
                <FieldLabel requerido={campo.obligatorio}>{campo.etiqueta}</FieldLabel>
                <Controller
                  control={formulario.control}
                  name={campo.nombre}
                  render={({ field }) =>
                    campo.tipo === 'area' ? (
                      <Textarea placeholder={campo.placeholder} {...field} />
                    ) : campo.tipo === 'fecha' ? (
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    ) : (
                      <Input
                        type={TIPO_HTML[campo.tipo]}
                        placeholder={campo.placeholder}
                        {...field}
                      />
                    )
                  }
                />
              </Field>
            ))}
          </div>
        );

        if (!conTarjetas) {
          return (
            <section key={grupo.seccion}>
              <SectionHeader titulo={grupo.seccion} />
              {contenido}
            </section>
          );
        }

        return (
          <Card key={grupo.seccion}>
            <SectionHeader titulo={grupo.seccion} />
            {contenido}
          </Card>
        );
      })}
    </div>
  );
}
