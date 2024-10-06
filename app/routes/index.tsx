import { createRoute } from "honox/factory";
import KemonoFriends3 from "../islands/KemonoFriends3NewsSearch";

export default createRoute((c) => {
  const name = "けもフレ３おしらせ検索";
  return c.render(
    <div class="flex flex-col">
      <h1 class="text-4xl font-bold p-4">{name}</h1>
      <KemonoFriends3 />
    </div>,
    { title: name }
  );
});
