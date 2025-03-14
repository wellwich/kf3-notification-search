import { describe, it, expect } from 'vitest';
import { normalizeQuery } from '../query-normalizer';

describe('Query Normalizer', () => {
  // 半角アルファベットの大文字小文字の変換
  it('半角アルファベットの大文字小文字の変換', () => {
    const query = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const expected = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
    const actual = normalizeQuery(query);
    expect(actual).toBe(expected);
  });

  // 全角英数字と記号類の変換
  it('全角英数字と記号類の変換(カッコだけそのまま)', () => {
    const query = '！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［＼］＾＿｀ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝～';
    const expected = '!"#$%&\'（）*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
    const actual = normalizeQuery(query);
    expect(actual).toBe(expected);
  });

  // カタカナの変換
  it('カタカナの変換', () => {
    const query = 'あアいイうウえエおオ　らラりリるルれレろロ　ぁァがパぃィぅゥづプぇェぉォじピゃャじュょョっッ';
    const expected = 'ああいいううええおお　ららりりるるれれろろ　ぁぁがぱぃぃぅぅづぷぇぇぉぉじぴゃゃじゅょょっっ';
    const actual = normalizeQuery(query);
    expect(actual).toBe(expected);
  });

  // 余分なスペースの削除
  it('余分なスペースの削除', () => {
    const query = '　 　 あイう　　  ';
    const expected = 'あいう';
    const actual = normalizeQuery(query);
    expect(actual).toBe(expected);
  });
});