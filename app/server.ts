import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import { newsArraySchema } from "./schema";

const app = createApp();

// アプリケーションのルートを表示
showRoutes(app);

// ニュースを取得するAPIエンドポイント
app.get("/api/kf3-news", async (context) => {
  const cacheKey = "kf3-news"; // キャッシュキー
  const cache = context.env.KF3_API_CACHE; // キャッシュオブジェクト

  // キャッシュを確認して、存在すればそれを返す
  const cachedNewsData = await cache.get(cacheKey);
  if (cachedNewsData) {
    return context.json(JSON.parse(cachedNewsData));
  }

  // ニュースデータを外部から取得
  const newsUrl = "https://kemono-friends-3.jp/info/all/entries.txt";
  const response = await fetch(newsUrl);
  const responseBody = await response.text();
  const newsJson = JSON.parse(responseBody);
  const newsArray = newsJson.news;

  // ニュースデータを日付の新しい順にソート
  newsArray.sort(
    (a: any, b: any) =>
      new Date(b.newsDate).getTime() - new Date(a.newsDate).getTime()
  );

  // データの形式をバリデーション
  const parsedNews = newsArraySchema.safeParse(newsArray);
  if (!parsedNews.success) {
    // バリデーションエラーがあればログに記録してエラーレスポンスを返す
    console.error("データ形式のエラー:", parsedNews.error);
    return context.json({ error: "データ形式が無効です" }, 400);
  }

  // キャッシュにニュースデータを保存（10分間有効）
  await cache.put(cacheKey, JSON.stringify(parsedNews.data), {
    expirationTtl: 60 * 10,
  });

  // 成功した場合、パースされたデータを返す
  return context.json(parsedNews.data);
});

export default app;
