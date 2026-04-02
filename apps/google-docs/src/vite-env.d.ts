/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK_ENTRY_CREATION?: string;
}

declare module '*.png' {
  const value: string;
  export default value;
}
