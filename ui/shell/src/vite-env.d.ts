/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRIDGE_MODE: string;
  readonly VITE_BRIDGE_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
