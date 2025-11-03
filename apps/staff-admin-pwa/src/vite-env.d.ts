/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_PWA_DISABLED: string;
  readonly VITE_PUSH_PUBLIC_KEY: string;
  readonly VITE_APP_VERSION: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
