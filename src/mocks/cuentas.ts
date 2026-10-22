/**
 * Cuentas de la API simulada que el acceso sugiere, una por rol.
 *
 * Vive aparte de `datos/seed.ts` para que la pantalla de acceso pueda
 * importarla sin arrastrar los datos simulados al paquete principal.
 */

import type { Rol } from '@/domain/types';

/** Contraseña de todas las cuentas simuladas (documentada en el README). */
export const CONTRASENA_SIMULADA = 'servis2026';

export const CUENTAS_SIMULADAS: readonly { correo: string; rol: Rol }[] = [
  { correo: 'l.batista@intec.edu.do', rol: 'estudiante' },
  { correo: 'r.almanzar@intec.edu.do', rol: 'personal_administrativo' },
  { correo: 'a.feliz@intec.edu.do', rol: 'coordinador' },
  { correo: 'e.lopez@intec.edu.do', rol: 'administrador' },
];
