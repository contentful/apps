interface ImportMetaEnv {
  readonly REACT_APP_NGROK_URL: string;
  readonly REACT_APP_ATLASSIAN_APP_CLIENT_ID: string;
}

export interface ImportMeta {
  env: ImportMetaEnv;
}
