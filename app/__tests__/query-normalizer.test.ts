// 簡易のテストケース

import { normalizeQuery } from '../query-normalizer';

function test(testName: string, fn: () => boolean) {
	try {
		const result = fn();
		console.log(`${result ? '✅' : '❌'} ${testName}`);
	} catch (error) {
		console.log(`❌ ${testName}`);
		console.error(' ', error);
	}
}

export function runTests() {
	// 半角アルファベットの大文字小文字の変換
	test('半角アルファベットの大文字小文字の変換', () => {
		const query = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const expected = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
		const actual = normalizeQuery(query);
		return actual === expected
	});

	// 全角英数字と記号類の変換
	test('全角英数字と記号類の変換(カッコだけそのまま)', () => {
		const query = '！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ［＼］＾＿｀ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ｛｜｝～';
		const expected = '!"#$%&\'（）*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
		const actual = normalizeQuery(query);
		return actual === expected;
	});

	// カタカナの変換
	test('カタカナの変換', () => {
		const query = 'あアいイうウえエおオ　らラりリるルれレろロ　ぁァがパぃィぅゥづプぇェぉォじピゃャじュょョっッ';
		const expected = 'ああいいううええおお　ららりりるるれれろろ　ぁぁがぱぃぃぅぅづぷぇぇぉぉじぴゃゃじゅょょっっ';
		const actual = normalizeQuery(query);
		return actual === expected;
	});

	// 余分なスペースの削除
	test('余分なスペースの削除', () => {
		const query = '　 　 あイう　　  ';
		const expected = 'あいう';
		const actual = normalizeQuery(query);
		return actual === expected;
	});
}

// テストの実行
console.log('Query Normalizer Tests:');
runTests();