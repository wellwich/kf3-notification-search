import { z } from "zod";

// ニュースデータのスキーマ定義
export const newsSchema = z.object({
  targetUrl: z.string(),
  title: z.string(),
  newsDate: z.string(),
  updated: z.string(),
});

// ニュースデータの配列のスキーマ
export const newsArraySchema = z.array(newsSchema);

// zod to type
export type News = z.infer<typeof newsSchema>;
