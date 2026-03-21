import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { imagetools } from "vite-imagetools";
import sri from "vite-plugin-sri-gen";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    imagetools(),
    sri({
      algorithm: "sha512",
      crossorigin: "anonymous",
      fetchCache: true,
      fetchTimeoutMs: 5000,
      skipResources: [],
      verboseLogging: false,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 700, // 700kb
  },
});
