import {} from "hono";
import { KVNamespace } from "@cloudflare/workers-types/experimental";

type Head = {
  title?: string;
};

declare module "hono" {
  interface Env {
    Variables: {};
    Bindings: {
      KF3_API_CACHE: KVNamespace;
    };
  }
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head):
      | Response
      | Promise<Response>;
  }
}
