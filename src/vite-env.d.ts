/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Hanko public API (MDD Iteration 6). Empty = local Hanko on http://localhost:8100. */
  readonly VITE_HANKO_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
