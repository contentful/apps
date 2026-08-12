/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_CONCEPTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
