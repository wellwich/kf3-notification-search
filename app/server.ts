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

  // 2024年11月7日までのニュースデータを取得
  const oldNewsUrl =
    "https://data.wellwich.com/kf3/entries_merged_20241107.json";
  const oldNewsData = await fetchNewsData(oldNewsUrl);

  // ニュースデータを外部から取得
  const newNewsUrl = "https://kemono-friends-3.jp/info/all/entries.txt";

  // 両方のURLからニュースデータを取得
  const newNewsData = await fetchNewsData(newNewsUrl);

  // ニュースデータをマージ
  const mergedNewsArray = [...oldNewsData, ...newNewsData.flat()];

  // 重複を削除（ニュースのIDを基に一意性を保証）
  const uniqueNewsArray = Array.from(
    new Map(mergedNewsArray.map((item) => [item.id, item])).values()
  );

  // ニュースデータを日付の新しい順にソート
  uniqueNewsArray.sort(
    (a: any, b: any) =>
      new Date(b.newsDate).getTime() - new Date(a.newsDate).getTime()
  );

  // データの形式をバリデーション
  const parsedNews = newsArraySchema.safeParse(uniqueNewsArray);
  if (!parsedNews.success) {
    // バリデーションエラーがあればログに記録してエラーレスポンスを返す
    console.error("データ形式のエラー:", parsedNews.error);
    return context.json({ error: "データ形式が無効です" }, 400);
  }

  // キャッシュにニュースデータを保存（5分間有効）
  await cache.put(cacheKey, JSON.stringify(parsedNews.data), {
    expirationTtl: 60 * 5,
  });

  // 成功した場合、パースされたデータを返す
  return context.json(parsedNews.data);
});

export default app;
