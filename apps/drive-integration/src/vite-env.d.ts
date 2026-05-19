/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK_EDIT_MODAL?: string;
  readonly VITE_LOCAL_AGENTS_API_BASE_URL?: string;
}

declare module '*.png' {
  const value: string;
  export default value;
}
