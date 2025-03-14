# けもフレ３おしらせ検索

[けもフレ３おしらせ検索](https://kf3-notification-search.wellwich.com/)は、けもフレ３のおしらせを検索することができるツールです。

## 作成した動機

このツールを作った動機は、けもフレ３公式サイトのおしらせが**重い**、**遅い**、**検索できない**、**昔のおしらせが辿れない**を解決させたいと思ったことにあります。
けもフレ３公式サイトに負担のない方法でおしらせを取得する方法が見つかったので、このツールを作成しました。

## 使った技術

- [HonoX](https://github.com/honojs/honox)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare KV](https://developers.cloudflare.com/kv/)

## ローカルでの再現方法

### 1. このリポジトリをクローンする。

```bash
git clone https://github.com/wellwich/kf3-notification-search
```

```bash
cd ./kf3-notification-search
```

### 2. 依存関係をインストールする。

```bash
npm install
```

or

```bash
bun install
```

### 3. wrangler で CloudFlare にログインする。

```bash
wrangler login
```

### 4. wrangler.example.toml を wrangler.toml にする。

既存の wrangler.toml がある場合は、削除してください。


### 5. ターミナルで Cloudflare KV の名前空間を作成する。

```bash
wrangler kv:namespace create KF3_API_CACHE
```

```bash
 ⛅️ wrangler 3.67.1
-------------------

🌀 Creating namespace with title "kv-worker-KF3_API_CACHE"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "KF3_API_CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

上記の id を wrangler.toml の id にダブルクオーテーション付きで修正する。

### 6. 開発環境で実行する

```bash
npm run dev
```

or

```bash
bun run dev
```

### 7. テストケース実行

```bash
npm test
```

or

```bash
bun run test
```
