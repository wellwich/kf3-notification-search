import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import { newsArraySchema } from "./schema";

const app = createApp();

// アプリケーションのルートを表示
showRoutes(app);

// ニュースデータを取得する関数
const fetchNewsData = async (url: string) => {
  const response = await fetch(url);
  const responseBody = await response.text();
  const newsJson = JSON.parse(responseBody);
  return newsJson.news;
};

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
  const newsUrls = [
    "https://kemono-friends-3.jp/info/app/important/entries.txt",
    "https://kemono-friends-3.jp/info/app/info/entries.txt",
    "https://kemono-friends-3.jp/info/app/invitation/entries.txt",
    "https://kemono-friends-3.jp/info/app/event/entries.txt",
    "https://kemono-friends-3.jp/info/app/campaign/entries.txt",
    "https://kemono-friends-3.jp/info/app/maintenance/entries.txt",
    "https://kemono-friends-3.jp/info/app/bug/entries.txt",
  ];

  // 両方のURLからニュースデータを取得
  const newsDataPromises = newsUrls.map(fetchNewsData);
  const newsArrays = await Promise.all(newsDataPromises);

  // ニュースデータをマージ
  const mergedNewsArray = newsArrays.flat();

  // ニュースデータを日付の新しい順にソート
  mergedNewsArray.sort(
    (a: any, b: any) =>
      new Date(b.newsDate).getTime() - new Date(a.newsDate).getTime()
  );

  // データの形式をバリデーション
  const parsedNews = newsArraySchema.safeParse(mergedNewsArray);
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