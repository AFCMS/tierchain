import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import sri from "vite-plugin-sri-gen";

import { discordEmbed } from "./plugins/discord-embed.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // https://github.com/oxc-project/oxc/issues/26161
    react({ compiler: false }),
    tailwindcss(),
    imagetools(),
    discordEmbed(),
    sri({
      algorithm: "sha512",
      crossorigin: "anonymous",
      importMapIntegrity: false,
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
