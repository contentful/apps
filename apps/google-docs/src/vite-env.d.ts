/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK_EDIT_MODAL?: string;
}

declare module '*.png' {
  const value: string;
  export default value;
}
