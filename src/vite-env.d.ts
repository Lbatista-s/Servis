/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Fuente de datos activa: `local` (localStorage) o `http` (API real). */
  readonly VITE_DATA_SOURCE?: 'local' | 'http';
  /** Raíz de la API (por defecto `/api`). Sólo con `VITE_DATA_SOURCE=http`. */
  readonly VITE_API_BASE_URL?: string;
  /** Autenticación de la API: `sesion` (cookie + CSRF, por defecto) o `jwt`. */
  readonly VITE_API_AUTH?: 'sesion' | 'jwt';
  /** Sólo desarrollo: destino del proxy de `/api` (el servidor de Django). */
  readonly VITE_API_PROXY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
