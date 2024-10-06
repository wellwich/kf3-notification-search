import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import honox from "honox/vite";
import { defineConfig } from "vite";
import ssg from "@hono/vite-ssg";
import client from "honox/vite/client";
import build from "@hono/vite-build/bun";

const entry = "/app/server.ts";

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
        build({
          entry: "./src/index.ts",
        }),
        honox({
          client: { input: ["/app/style.css"] },
          devServer: { adapter },
        }),
        pages(),
        ssg({ entry }),
      ],
    };
  }
});
