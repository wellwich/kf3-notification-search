import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import honox from "honox/vite";
import { defineConfig } from "vite";
import client from "honox/vite/client";
import build from "@hono/vite-build/bun";

export default defineConfig(({ mode }) => {
  if (mode === "client") {
    return {
      plugins: [client()],
    };
  } else {
    return {
      build: {
        emptyOutDir: false,
      },
      plugins: [
        honox({
          client: { input: ["/app/style.css"] },
          devServer: { adapter },
        }),
        pages(),
        build(),
      ],
    };
  }
});
