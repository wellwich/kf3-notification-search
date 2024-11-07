// 簡易のテストケース

import { QueryParser } from '../query-parser';

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
    // 単一単語のテスト
    test('単一単語', () => {
        const parser = new QueryParser('測定');
        return (
            parser.parse()('測定あり') === true &&
            parser.parse()('何もなし') === false
        );
    });

    // 暗黙的なAND
    test('暗黙的なAND', () => {
        const parser = new QueryParser('測定 掃除');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('測定のみ') === false &&
            parser.parse()('掃除のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // 明示的なAND
    test('明示的なAND', () => {
        const parser = new QueryParser('測定 AND 掃除');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('測定のみ') === false &&
            parser.parse()('掃除のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // OR
    test('OR', () => {
        const parser = new QueryParser('測定 OR 掃除');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('測定のみ') === true &&
            parser.parse()('掃除のみ') === true &&
            parser.parse()('何もなし') === false
        );
    });

    // 単純なNOT
    test('単純なNOT', () => {
        const parser = new QueryParser('-測定');
        return (
            parser.parse()('なし') === true &&
			parser.parse()('測定あり') === false
        );
    });

    // ANDとNOTの組み合わせ
    test('ANDとNOTの組み合わせ', () => {
        const parser = new QueryParser('掃除 -測定');
        return (
            parser.parse()('掃除のみ') === true &&
            parser.parse()('測定のみ') === false &&
            parser.parse()('掃除と測定') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // ORとNOTの組み合わせ
    test('ORとNOTの組み合わせ', () => {
        const parser = new QueryParser('掃除 OR -測定');
        return (
            parser.parse()('掃除あり') === true &&
            parser.parse()('測定あり') === false &&
            parser.parse()('何もなし') === true &&
            parser.parse()('掃除あり測定あり') === true
        );
    });

    // 単純な括弧
    test('単純な括弧', () => {
        const parser = new QueryParser('(測定 掃除)');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('測定のみ') === false &&
			parser.parse()('掃除のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // 冗長な括弧
    test('冗長な括弧', () => {
        const parser = new QueryParser('((((測定)) (掃除)))');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('測定のみ') === false &&
			parser.parse()('掃除のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // 括弧とORの組み合わせ
    test('括弧とORの組み合わせ', () => {
        const parser = new QueryParser('予告 (測定 OR 掃除)');
        return (
            parser.parse()('測定と掃除の予告') === true &&
            parser.parse()('測定の予告') === true &&
            parser.parse()('掃除の予告') === true &&
            parser.parse()('掃除のみ') === false &&
            parser.parse()('測定のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // 括弧とNOTの組み合わせ
    test('括弧とNOTの組み合わせ', () => {
        const parser = new QueryParser('(測定 -予告)');
        return (
            parser.parse()('測定あり') === true &&
            parser.parse()('予告付きの測定') === false &&
            parser.parse()('予告のみ') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // 複雑な組み合わせ1
    test('複雑な組み合わせ1', () => {
        const parser = new QueryParser('測定 (掃除 OR -メンテナンス)');
        return (
            parser.parse()('測定と掃除を実施') === true &&
            parser.parse()('測定のみを実施') === true &&
            parser.parse()('測定とメンテナンス') === false
        );
    });

    // 複雑な組み合わせ2
    test('複雑な組み合わせ2', () => {
        const parser = new QueryParser('(測定 OR メンテナンス) -予告 掃除');
        return (
            parser.parse()('測定と掃除') === true &&
            parser.parse()('メンテナンスと掃除を実施') === true &&
            parser.parse()('予告付きの測定と掃除') === false &&
			parser.parse()('何もなし') === false
        );
    });

    // エラーケース
    test('不正な括弧（開き括弧なし）', () => {
        try {
            new QueryParser('測定) 掃除').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('不正な括弧（閉じ括弧なし）', () => {
        try {
            new QueryParser('測定 (掃除').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('不正なAND（右オペランドなし）', () => {
        try {
            new QueryParser('測定 掃除 AND').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('不正なOR（右オペランドなし）', () => {
        try {
            new QueryParser('測定 掃除 OR').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('不正なAND（左オペランドなし）', () => {
        try {
            new QueryParser('AND 測定 掃除').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('不正なOR（右オペランドなし）', () => {
        try {
            new QueryParser('OR 測定 掃除').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('()単体', () => {
        try {
            new QueryParser('()').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('ANDの後にOR', () => {
        try {
            new QueryParser('aaa and or').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('ORの後にAND', () => {
        try {
            new QueryParser('aaa or and').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('ANDの前に-', () => {
        try {
            new QueryParser('aaa -and').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('ORの前に-', () => {
        try {
            new QueryParser('aaa -or').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

    test('閉じ括弧の前に-', () => {
        try {
            new QueryParser('(aaa -)').parse()('テスト');
            return false;
        } catch {
            return true;
        }
    });

}

// テストの実行
console.log('Query Parser Tests:');
runTests();