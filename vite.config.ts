import honox from "honox/vite";
import { defineConfig } from "vite";
import build from "@hono/vite-build/cloudflare-pages";

export default defineConfig({
  plugins: [
    honox({
      client: {
        input: ["/app/style.css"],
      },
    }),
    build(),
  ],
});
