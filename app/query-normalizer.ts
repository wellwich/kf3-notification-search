
// 全角英数字・記号の変換マップ
const zenkakuToHankakuMap: Map<string, string> = new Map();
const initZenkakuToHankakuMap = (): void => {
	for (let i = 0; i < 95; i++) {
		const zenkaku = String.fromCharCode(0xFF01 + i);
		const hankaku = String.fromCharCode(0x21 + i);
		if (zenkaku === '（' || zenkaku === '）') {
			// カッコは演算順序制御と競合するため変換しない
			continue;
		}
		zenkakuToHankakuMap.set(zenkaku, hankaku);
	}
};

// カタカナ→ひらがなの変換マップ
const katakanaToHiraganaMap: Map<string, string> = new Map();
const initKatakanaToHiraganaMap = (): void => {
	for (let i = 0; i < 86; i++) {
		const katakana = String.fromCharCode(0x30A1 + i);
		const hiragana = String.fromCharCode(0x3041 + i);
		katakanaToHiraganaMap.set(katakana, hiragana);
	}
};

// マップの初期化を一度だけ実行
initZenkakuToHankakuMap();
initKatakanaToHiraganaMap();

/**
 * 文字列を配列に分割せずに直接変換を行う最適化された関数
 * @param text 変換対象テキスト
 * @returns 変換後のテキスト
 */
export function normalizeQuery(text: string): string {
	text = text.trim();

	const len = text.length;
	const result = new Array<string>(len);

	for (let i = 0; i < len; i++) {
		const char = text[i];

		// 全角英数字・記号の変換
		const halfWidth = zenkakuToHankakuMap.get(char);
		if (halfWidth !== undefined) {
			result[i] = halfWidth;
			continue;
		}

		// カタカナの変換
		const hiragana = katakanaToHiraganaMap.get(char);
		if (hiragana !== undefined) {
			result[i] = hiragana;
			continue;
		}

		// その他の文字はそのまま追加
		result[i] = char;
	}

	return result.join('').toLowerCase();
}