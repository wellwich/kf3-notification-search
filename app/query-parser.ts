// query-parser.ts

/**
 * クエリで使用可能なトークンの種類を定義
 */
export enum TokenType {
    WORD = 'WORD',
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
    LEFT_PAREN = 'LEFT_PAREN',
    RIGHT_PAREN = 'RIGHT_PAREN'
}

/**
 * クエリを構成する個々のトークン
 */
export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

/**
 * パース処理中に発生するエラー
 */
export class QueryParseError extends Error {
    constructor(message: string, public position: number) {
        super(`${message} at position ${position}`);
        this.name = 'QueryParseError';
    }
}

/**
 * クエリを解析して検索条件を生成するパーサー
 */
export class QueryParser {
    private tokens: Token[] = [];
    private currentPosition = 0;

    /**
     * クエリ文字列からパーサーを初期化
     */
    constructor(private queryString: string) {
        this.tokenize();
    }

    /**
     * クエリ文字列を解析して判定関数を返す
     */
    public parse(): (text: string) => boolean {
        this.currentPosition = 0;
        return this.parseExpression();
    }

    /**
     * クエリ文字列をトークンに分割
     */
    private tokenize(): void {
        const tokens: Token[] = [];
        let position = 0;
        let i = 0;
        let parenStack: number[] = [];

        while (i < this.queryString.length) {
            const char = this.queryString[i];

            // 空白をスキップ
            if (char === ' ' || char === '　') {
                i++;
                position++;
                continue;
            }

            // 括弧の処理
            if (char === '(' || char === ')') {
                if (char === '(') {
                    parenStack.push(position);
                    tokens.push({
                        type: TokenType.LEFT_PAREN,
                        value: char,
                        position
                    });
                } else { // char === ')'
                    if (parenStack.length === 0) {
                        // 開きカッコがない閉じカッコを検出
                        throw new QueryParseError('Unmatched closing parenthesis', position);
                    }
                    parenStack.pop();
                    tokens.push({
                        type: TokenType.RIGHT_PAREN,
                        value: char,
                        position
                    });
                }
                i++;
                position++;
                continue;
            }

            // NOT演算子(-) の処理
            if (char === '-' && (i === 0 || this.queryString[i - 1] === ' ' || this.queryString[i - 1] === '　' || this.queryString[i - 1] === '(')) {
                tokens.push({
                    type: TokenType.NOT,
                    value: 'NOT',
                    position
                });
                i++;
                position++;
                continue;
            }

            // 単語の処理
            let word = '';
            const startPos = position;
            while (i < this.queryString.length &&
					this.queryString[i] !== ' ' &&
					this.queryString[i] !== '　' &&
					this.queryString[i] !== '(' &&
					this.queryString[i] !== ')' &&
					this.queryString[i] !== '-') {
                word += this.queryString[i];
                i++;
                position++;
            }

            if (word) {
                const upperWord = word.toUpperCase();
                if (upperWord === 'AND' || upperWord === 'OR') {
                    tokens.push({
                        type: upperWord === 'AND' ? TokenType.AND : TokenType.OR,
                        value: upperWord,
                        position: startPos
                    });
                } else {
                    tokens.push({
                        type: TokenType.WORD,
                        value: word,
                        position: startPos
                    });
                }
            }
        }

        // 最終的に開きカッコが残っていた場合はエラー
        if (parenStack.length > 0) {
            throw new QueryParseError('Unmatched opening parenthesis', parenStack[0]);
        }

        this.tokens = this.insertImplicitAnds(tokens);
    }

    /**
     * 暗黙的なANDトークンを挿入
     */
    private insertImplicitAnds(tokens: Token[]): Token[] {
        const result: Token[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const current = tokens[i];
            result.push(current);

            if (i < tokens.length - 1) {
                const next = tokens[i + 1];
                const needsAnd =
                    // 現在のトークンが単語で、次がNOTまたは単語または左括弧の場合
                    (current.type === TokenType.WORD &&
                        (next.type === TokenType.NOT ||
                         next.type === TokenType.WORD ||
                         next.type === TokenType.LEFT_PAREN)) ||
                    // 現在のトークンが右括弧で、次がNOTまたは単語または左括弧の場合
                    (current.type === TokenType.RIGHT_PAREN &&
                        (next.type === TokenType.NOT ||
                         next.type === TokenType.WORD ||
                         next.type === TokenType.LEFT_PAREN));

                if (needsAnd &&
                    next.type !== TokenType.OR &&
                    next.type !== TokenType.AND) {
                    result.push({
                        type: TokenType.AND,
                        value: 'AND',
                        position: current.position + current.value.length
                    });
                }
            }
        }

        return result;
    }

    /**
     * 現在のトークンを取得
     */
    private getCurrentToken(): Token | null {
        return this.currentPosition < this.tokens.length
            ? this.tokens[this.currentPosition]
            : null;
    }

    /**
     * トークンを1つ進める
     */
    private advance(): void {
        this.currentPosition++;
    }

    /**
     * クエリ式全体を解析
     */
    private parseExpression(): (text: string) => boolean {
        let evaluator = this.parseAndExpression();

        while (this.getCurrentToken()?.type === TokenType.OR) {
            this.advance();
            const rightEvaluator = this.parseAndExpression();
            const leftEvaluator = evaluator;
            evaluator = (text: string) => leftEvaluator(text) || rightEvaluator(text);
        }

        return evaluator;
    }

    /**
     * AND式を解析
     */
    private parseAndExpression(): (text: string) => boolean {
        let evaluator = this.parseNotExpression();

        while (this.getCurrentToken()?.type === TokenType.AND) {
            this.advance();
            const rightEvaluator = this.parseNotExpression();
            const leftEvaluator = evaluator;
            evaluator = (text: string) => leftEvaluator(text) && rightEvaluator(text);
        }

        return evaluator;
    }

    /**
     * NOT式を解析
     */
    private parseNotExpression(): (text: string) => boolean {
        if (this.getCurrentToken()?.type === TokenType.NOT) {
            this.advance();
            const operandEvaluator = this.parsePrimary();
            return (text: string) => !operandEvaluator(text);
        }
        return this.parsePrimary();
    }

    /**
     * 基本式（単語またはカッコで囲まれた式）を解析
     */
    private parsePrimary(): (text: string) => boolean {
        const token = this.getCurrentToken();
        if (!token) {
            throw new QueryParseError('Unexpected end of query', this.queryString.length);
        }

        this.advance();

        switch (token.type) {
            case TokenType.WORD:
                return (text: string) => text.includes(token.value);

            case TokenType.LEFT_PAREN: {
                const evaluator = this.parseExpression();
                const nextToken = this.getCurrentToken();

                if (nextToken?.type !== TokenType.RIGHT_PAREN) {
                    throw new QueryParseError(
                        'Missing closing parenthesis',
                        token.position
                    );
                }

                this.advance();
                return evaluator;
            }

            default:
                throw new QueryParseError(
                    `Unexpected token: ${token.value}`,
                    token.position
                );
        }
    }
}