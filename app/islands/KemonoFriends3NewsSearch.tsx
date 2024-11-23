import { useEffect, useState } from "hono/jsx";
import { newsArraySchema, News } from "../schema";
import { QueryParser } from "../query-parser";

// ニュースデータの検索・表示コンポーネント
const KemonoFriends3NewsSearch = () => {
  const [newsData, setNewsData] = useState<Array<News>>([]); // 表示されるニュースデータ
  const [allNewsData, setAllNewsData] = useState<Array<News>>([]); // 全ニュースデータ
  const [searchKeyword, setSearchKeyword] = useState(""); // 検索キーワード
  const [selectedDisplayLimitString, setSelectedDisplayLimitString] = useState<string>("10"); // 選択された表示件数(文字列)
  const [selectedDisplayLimit, setSelectedDisplayLimit] = useState<number>(10); // 選択された表示件数(数値)
  const [displayLimit, setDisplayLimit] = useState<number>(10); // 表示件数(数値、もっと見るボタンで加算)
  const [sortOrder, setSortOrder] = useState("desc"); // ソート順
  const [isSearchVisible, setIsSearchVisible] = useState(false); // 検索欄の表示状態
  const [startDate, setStartDate] = useState("2019-09-24"); // フィルター開始日
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]); // フィルター終了日
  const [numberOfNews, setNumberOfNews] = useState(0); // ニュースの数
  const [isLoading, setIsLoading] = useState(true); // データ取得中の状態

  // コンポーネント初回レンダリング時にニュースデータを取得
  useEffect(() => {
    fetch("/api/kf3-news")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const result = newsArraySchema.safeParse(data);
        if (result.success) {
          const sortedData = getSortedNews(result.data); // 全データをソート
          setAllNewsData(sortedData); // 全データをセット
          setNewsData(sortedData.slice(0, selectedDisplayLimit)); // 初期表示データをセット
          setNumberOfNews(sortedData.length); // ニュースの件数を設定

          // 表示件数を設定
          const savedDisplayLimit = localStorage.getItem("selectedDisplayLimit");
          if (savedDisplayLimit) {
            setSelectedDisplayLimitString(savedDisplayLimit);
          }
        } else {
          console.error("Data validation failed", result.error);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch news data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 表示件数が変更されたときに表示件数を更新
  useEffect(() => {
    const newLimit =
      selectedDisplayLimitString === "all"
        ? Infinity
        : Number(selectedDisplayLimitString);
    setSelectedDisplayLimit(newLimit);
    setDisplayLimit(newLimit);
  }, [selectedDisplayLimitString]);

  // 検索キーワードを除く検索条件が変更されたときに検索を実行
  useEffect(() => {
    handleSearch();
  }, [selectedDisplayLimit, displayLimit, sortOrder, startDate, endDate]);

  // 検索キーワードの変更をハンドリング
  const handleSearchChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      setSearchKeyword(event.target.value);
    }
  };

  // Enterキーが押されたときにキーワード検索を実行
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || event.key !== "Enter") return;
    handleSearch();
  };

  // 検索を実行する関数
  const handleSearch = () => {
    let filteredNews;
    filteredNews = filterNewsByKeyword(allNewsData, searchKeyword);
    filteredNews = filterNewsByDate(filteredNews, startDate, endDate);
    const sortedNews = getSortedNews(filteredNews);
    setNumberOfNews(filteredNews.length);
    setNewsData(sortedNews.slice(0, displayLimit));
  };

  // 日付によるフィルター
  const filterNewsByDate = (newsArray: Array<News>, start: string, end: string) => {
    return newsArray.filter((news) => {
      const newsDate = parseDateString(news.newsDate);
      const startDate = start ? new Date(new Date(start).setHours(0, 0, 0, 0)).getTime() : -Infinity;
      const endDate = end ? new Date(new Date(end).setHours(0, 0, 0, 0)).getTime() : Infinity;
      return newsDate >= startDate && newsDate < endDate + 86400000; // 1日分のミリ秒を加算
    });
  };

  // 日付の変更をハンドリング
  const handleStartDateChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      setStartDate(event.target.value);
    }
  };

  const handleEndDateChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      setEndDate(event.target.value);
    }
  };

  // 「もっと見る」ボタンを押した時の処理
  const handleLoadMore = () => {
    setDisplayLimit((prevLimit) => prevLimit + 10);
  };

  // ソート順を変更する
  const handleSortOrderChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      setSortOrder(event.target.value);
    }
  };

  // 表示件数を変更する
  const handleSelectedDisplayLimitChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      setSelectedDisplayLimitString(event.target.value);
      localStorage.setItem("selectedDisplayLimit", event.target.value);
    }
  };

  // 検索欄の表示・非表示を切り替える
  const toggleSearchVisibility = () => {
    setIsSearchVisible((prev) => !prev);
  };

  // ニュースデータをキーワードでフィルター
  const filterNewsByKeyword = (newsArray: Array<News>, keyword: string) => {
    if (!keyword.trim()) return newsArray;

    try {
      const parser = new QueryParser(keyword);
      let evaluator;
      try {
        evaluator = parser.parse();
      } catch (error) {
        console.error("Query parsing error:", error);
        return [];
      }
      return newsArray.filter(news => evaluator(news.title));
    } catch (error) {
      console.error("Query parsing error:", error);
      // エラー時は単純な部分一致検索にフォールバック
      return newsArray.filter(news => news.title.includes(keyword));
    }
  };

  // ニュースデータをソート
  const getSortedNews = (data: Array<News>) => {
    return data.sort((a, b) => {
      const aDate = parseDateString(a.newsDate);
      const bDate = parseDateString(b.newsDate);
      return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
    });
  };

  // "yyyy年MM月dd日 HH時mm分ss秒"形式の日付をパース
  const parseDateString = (dateString: string): number => {
    const regex = /(\d{4})年(\d{2})月(\d{2})日 (\d{2})時(\d{2})分(\d{2})秒/;
    const match = dateString.match(regex);
    if (!match) throw new Error("Invalid date format");
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    ).getTime();
  };

  return (
    <div class="min-h-screen bg-yellow-400 px-4">
      <div class="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-6 my-4">
        {isLoading ? (
          <div class="flex justify-center items-center p-8">
            <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <span class="ml-4 text-gray-600 font-medium">データを取得しています...</span>
          </div>
        ) : (
          <div class="space-y-6">
            {/* 検索欄トグルボタン */}
            <button
              onClick={toggleSearchVisibility}
              class="w-full md:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                class={`w-5 h-5 transition-transform duration-200 ${
                  isSearchVisible ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              検索オプション
            </button>

            {/* 検索欄 */}
            <div
              class={`transition-all duration-300 ease-in-out overflow-hidden ${
                isSearchVisible ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div class="bg-white p-1 rounded-lg space-y-3">
                {/* ソート順と表示件数 */}
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <label class="text-sm font-medium text-gray-700 whitespace-nowrap" for="sortOrder">
                      ソート順:
                    </label>
                    <select
                      id="sortOrder"
                      value={sortOrder}
                      onChange={handleSortOrderChange}
                      class="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="desc">新しい順</option>
                      <option value="asc">古い順</option>
                    </select>
                  </div>

                  <div class="flex items-center gap-2">
                    <label class="text-sm font-medium text-gray-700 whitespace-nowrap" for="displayLimit">
                      表示件数:
                    </label>
                    <select
                      id="displayLimit"
                      value={selectedDisplayLimit === Infinity ? "all" : selectedDisplayLimit.toString()}
                      onChange={handleSelectedDisplayLimitChange}
                      class="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10">10件</option>
                      <option value="50">50件</option>
                      <option value="100">100件</option>
                      <option value="all">全件</option>
                    </select>
                  </div>
                </div>

                {/* キーワード検索 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    キーワード検索:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="(測定 or 掃除) 開催 -予告"
                      value={searchKeyword}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      検索
                    </button>
                  </div>
                </div>

                {/* 日付範囲 */}
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-gray-700">
                    期間:
                  </label>
                  <div class="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={handleStartDateChange}
                      class="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span class="text-gray-500">～</span>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={handleEndDateChange}
                      class="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* お知らせヒット件数 */}
            <div class="text-sm text-gray-600 font-medium mt-0">
              おしらせの件数: {numberOfNews}件
            </div>

            {/* ニュースリスト */}
            <ul class="space-y-4">
              {newsData.map((news, index) => (
                <li
                  key={index}
                  class="group bg-white hover:bg-blue-50 border border-gray-300 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <a
                    href={`https://kemono-friends-3.jp${news.targetUrl}`}
                    target="_blank"
                    class="block p-4"
                  >
                    <p class="text-gray-800 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                      {news.title}
                    </p>
                    <time class="text-sm text-gray-500">
                      {news.newsDate.slice(0, 11)}
                    </time>
                  </a>
                </li>
              ))}
            </ul>

            {/* もっと見るボタン */}
            {numberOfNews > displayLimit && (
              <div class="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  class="w-full md:w-96 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  もっと見る
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KemonoFriends3NewsSearch;