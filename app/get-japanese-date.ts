import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

export const getJapaneseDate = (date?: string) => {
  if (!date) {
    return dayjs().format("YYYY-MM-DD");
  }
  return dayjs(date).format("YYYY-MM-DD");
};
