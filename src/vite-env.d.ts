/// <reference types="vite/client" />

/**
 * This is a hack to make vite-imagetools work with typescript.
 */
declare module "*&imagetools" {
  const out: string;
  export default out;
}

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_CHAIN?: "mainnet" | "sepolia";
  readonly VITE_MAINNET_RPC_URL?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
