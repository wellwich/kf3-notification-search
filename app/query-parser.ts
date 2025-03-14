/**
 * クエリで使用可能なトークンの種類
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
 * クエリを構成するトークン
 */
interface Token {
  type: TokenType;
  value: string;
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
  constructor(private query: string) {
    this.tokens = this.tokenize();
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
  private tokenize(): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    // クエリ文字列を先頭から走査
    while (i < this.query.length) {
      const char = this.query[i];

      // 空白をスキップ
      if (char === ' ' || char === '　') {
        i++;
        continue;
      }

      // 括弧の処理
      if (char === '(') {
        tokens.push({ type: TokenType.LEFT_PAREN, value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: TokenType.RIGHT_PAREN, value: ')' });
        i++;
        continue;
      }

      // NOT演算子の処理
      if (char === '-' &&
        (i === 0 || /[\s(]/.test(this.query[i-1])) &&
        (i < this.query.length - 1 && !/[\s()]/.test(this.query[i+1]))) {
        tokens.push({ type: TokenType.NOT, value: '-' });
        i++;
        continue;
      }

      // 単語の処理
      let word = '';
      while (i < this.query.length && !/[\s()]/.test(this.query[i])) {
        word += this.query[i];
        i++;
      }

      if (word) {
        // ANDとORの特別処理
        const upperWord = word.toUpperCase();
        if (upperWord === 'AND') {
          tokens.push({ type: TokenType.AND, value: 'and' });
        } else if (upperWord === 'OR') {
          tokens.push({ type: TokenType.OR, value: 'or' });
        } else {
          tokens.push({ type: TokenType.WORD, value: word.toLowerCase() });
        }
      }
    }

    // 不正な演算子と括弧を修正
    const fixedTokens = this.validateTokens(tokens);

    // 暗黙的なANDを挿入
    return this.insertImplicitAnds(fixedTokens);
  }

  /**
   * トークンの正当性をチェックして修正
   */
  private validateTokens(tokens: Token[]): Token[] {
    // 括弧のバランスを修正
    const stack: number[] = [];
    const result = tokens.map((token, i) => {
      if (token.type === TokenType.LEFT_PAREN) {
        stack.push(i);
        return token;
      } else if (token.type === TokenType.RIGHT_PAREN) {
        if (stack.length === 0) {
          // 対応する開き括弧がない場合は単語として扱う
          return { type: TokenType.WORD, value: token.value };
        } else {
          stack.pop();
          return token;
        }
      } else {
        return token;
      }
    });

    // 無効な演算子をWORDに変換
    return result.map((token, i) => {
      if ((token.type === TokenType.AND || token.type === TokenType.OR) &&
        (i === 0 || i === tokens.length - 1)) {
        // クエリの先頭または末尾にある演算子
        return { ...token, type: TokenType.WORD };
      }

      if ((token.type === TokenType.AND || token.type === TokenType.OR) && i > 0) {
        const prev = result[i - 1];
        // 左側が別の演算子または開き括弧の場合
        if (prev.type === TokenType.AND || prev.type === TokenType.OR ||
          prev.type === TokenType.NOT || prev.type === TokenType.LEFT_PAREN) {
          return { ...token, type: TokenType.WORD };
        }
      }

      if (token.type === TokenType.NOT &&
        (i === tokens.length - 1 ||
         (i < tokens.length - 1 &&
          (result[i + 1].type === TokenType.AND ||
           result[i + 1].type === TokenType.OR ||
           result[i + 1].type === TokenType.NOT ||
           result[i + 1].type === TokenType.RIGHT_PAREN)))) {
        return { ...token, type: TokenType.WORD };
      }

      return token;
    });
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

        // 暗黙的なANDが必要か判定
        const needsAnd =
          (current.type === TokenType.WORD || current.type === TokenType.RIGHT_PAREN) &&
          (next.type === TokenType.WORD || next.type === TokenType.NOT || next.type === TokenType.LEFT_PAREN);

        if (needsAnd) {
          result.push({ type: TokenType.AND, value: 'and' });
        }
      }
    }

    return result;
  }

  /**
   * 現在のトークンを取得
   */
  private getCurrentToken(): Token | null {
    return this.currentPosition < this.tokens.length ? this.tokens[this.currentPosition] : null;
  }

  /**
   * クエリ式全体を解析
   */
  private parseExpression(): (text: string) => boolean {
    let evaluator = this.parseAndExpression();

    while (this.getCurrentToken()?.type === TokenType.OR) {
      this.currentPosition++; // OR演算子をスキップ

      if (this.currentPosition >= this.tokens.length) {
        return () => false;
      }

      const rightEval = this.parseAndExpression();
      const leftEval = evaluator;

      evaluator = (text: string) => leftEval(text) || rightEval(text);
    }

    return (text: string) => evaluator(text.toLowerCase());
  }

  /**
   * AND式を解析
   */
  private parseAndExpression(): (text: string) => boolean {
    let evaluator = this.parseTerm();

    while (this.getCurrentToken()?.type === TokenType.AND) {
      this.currentPosition++; // AND演算子をスキップ

      if (this.currentPosition >= this.tokens.length) {
        return () => false;
      }

      const rightEval = this.parseTerm();
      const leftEval = evaluator;

      evaluator = (text: string) => leftEval(text) && rightEval(text);
    }

    return evaluator;
  }

  /**
   * 単項式(NOTまたは単語)を解析
   */
  private parseTerm(): (text: string) => boolean {
    const token = this.getCurrentToken();

    if (!token) {
      return () => false;
    }

    if (token.type === TokenType.NOT) {
      this.currentPosition++; // NOTをスキップ

      if (this.currentPosition >= this.tokens.length) {
        return (text: string) => text.includes('-');
      }

      const operand = this.parseFactor();
      return (text: string) => !operand(text);
    }

    return this.parseFactor();
  }

  /**
   * 因子(単語または括弧で囲まれた式)を解析
   */
  private parseFactor(): (text: string) => boolean {
    const token = this.getCurrentToken();

    if (!token) {
      return () => false;
    }

    this.currentPosition++; // トークンを消費

    if (token.type === TokenType.WORD) {
      return (text: string) => text.includes(token.value);
    } else if (token.type === TokenType.LEFT_PAREN) {
      const expr = this.parseExpression();

      // 閉じ括弧があれば消費
      if (this.getCurrentToken()?.type === TokenType.RIGHT_PAREN) {
        this.currentPosition++;
      }

      return expr;
    } else {
      // その他のトークンはテキストとして扱う
      return (text: string) => text.includes(token.value);
    }
  }
}