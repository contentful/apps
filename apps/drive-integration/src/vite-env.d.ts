/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_AGENTS_API_BASE_URL?: string;
  readonly VITE_LD_CLIENT_ID?: string;
  readonly VITE_GOOGLE_PICKER_API_KEY?: string;
  readonly VITE_GOOGLE_APP_ID?: string;
  readonly VITE_ENV?: string;
  readonly VITE_SEGMENT_WRITE_KEY?: string;
}

interface Window {
  _fs_run_in_iframe?: boolean;
}

declare module '*.png' {
  const value: string;
  export default value;
}
