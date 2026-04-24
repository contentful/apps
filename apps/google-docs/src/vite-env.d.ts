/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK_EDIT_MODAL?: string;
  readonly VITE_ENABLE_MOCK_REVIEW_PAYLOAD?: string;
}

declare module '*.png' {
  const value: string;
  export default value;
}
