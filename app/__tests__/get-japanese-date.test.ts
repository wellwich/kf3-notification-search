import { describe, it, expect } from 'vitest';
import { getJapaneseDate } from "../get-japanese-date";
import dayjs from "dayjs";
import "dayjs/locale/ja";

describe('getJapaneseDate', () => {
  const UtcDateMock = "2021-12-31T15:00:00Z"; // 日本時間とUTCとの差が9時間のため、日本時間で2022-01-01になる

  it('日本時間が正しく表示されるか', () => {
    dayjs.locale("ja");
    const expected = dayjs(UtcDateMock).format("YYYY-MM-DD"); // 2022-01-01
    const actual = getJapaneseDate(UtcDateMock); // 2022-01-01
    expect(actual).toBe(expected);
  });

  it('Date関数とgetJapaneseDateの結果が異なるか', () => {
    const expected = new Date(UtcDateMock).toISOString().split("T")[0]; // 2021-12-31
    const actual = getJapaneseDate(UtcDateMock); // 2022-01-01
    expect(actual).not.toBe(expected);
  });

  it('現在日時が返るか', () => {
    const expected = dayjs().format("YYYY-MM-DD");
    const actual = getJapaneseDate();
    expect(actual).toBe(expected);
  });

  it('DateオブジェクトとgetJapaneseDateでギリギリ日付が変わるケース', () => {
    const UtcDateMock = "2021-12-31T15:00:00Z"; // 日本時間でギリギリ2022-01-01になる
    const expected = new Date(UtcDateMock).toISOString().split("T")[0]; // 2021-12-31
    const actual = getJapaneseDate(UtcDateMock); // 2022-01-01
    expect(actual).not.toBe(expected);
  });

  it('DateオブジェクトとgetJapaneseDateでギリギリ日付が変わらないケース', () => {
    const UtcDateMock = "2021-12-31T14:59:59Z"; // 日本時間でギリギリ2021-12-31になる
    const expected = new Date(UtcDateMock).toISOString().split("T")[0]; // 2021-12-31
    const actual = getJapaneseDate(UtcDateMock); // 2021-12-31
    expect(actual).toBe(expected);
  });
});
