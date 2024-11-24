import { getJapaneseDate } from "../get-japanese-date";
import dayjs from "dayjs";
import "dayjs/locale/ja";

function test(testName: string, fn: () => boolean) {
  try {
    const result = fn();
    console.log(`${result ? "✅" : "❌"} ${testName}`);
  } catch (error) {
    console.log(`❌ ${testName}`);
    console.error(" ", error);
  }
}

export function runTests() {
  const UtcDateMock = "2021-12-31T15:00:00Z"; // 日本時間とUTCとの差が9時間のため、日本時間で2022-01-01になる
  test("日本時間が正しく表示されるか", () => {
    dayjs.locale("ja");
    const expected = dayjs(UtcDateMock).format("YYYY-MM-DD"); // 2022-01-01
    const actual = getJapaneseDate(UtcDateMock); // 2022-01-01
    return expected === actual;
  });

  test("Date関数とgetJapaneseDateの結果が異なるか", () => {
    const expected = new Date(UtcDateMock).toISOString().split("T")[0]; // 2021-12-31
    const actual = getJapaneseDate(UtcDateMock); // 2022-01-01
    return expected !== actual;
  });

  test("現在日時が返るか", () => {
    const expected = dayjs().format("YYYY-MM-DD");
    const actual = getJapaneseDate();
    return expected === actual;
  });
}

console.log("get-japanese-date Tests:");
runTests();
