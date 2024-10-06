import { createRoute } from "honox/factory";
import KemonoFriends3 from "../islands/KemonoFriends3NewsSearch";

export default createRoute((c) => {
  const name = c.req.query("name") ?? "Hono";
  return c.render(
    <div class="flex flex-col">
      <KemonoFriends3 />
    </div>,
    { title: name }
  );
});
