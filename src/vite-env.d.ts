/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ENV_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
