/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Fuente de datos activa: `local` (localStorage) o `http` (API real). */
  readonly VITE_DATA_SOURCE?: 'local' | 'http';
  /** URL base de la API. Sólo se usa cuando `VITE_DATA_SOURCE` es `http`. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
