/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_SEGMENT_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
