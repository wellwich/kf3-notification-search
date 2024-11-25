import { useEffect, useState } from "hono/jsx";
import { newsArraySchema, News } from "../schema";
import { QueryParser } from "../query-parser";
import { getJapaneseDate } from "../get-japanese-date";


// ニュースデータの検索・表示コンポーネント
const KemonoFriends3NewsSearch = () => {
  const [newsData, setNewsData] = useState<Array<News>>([]); // 表示されるニュースデータ
  const [allNewsData, setAllNewsData] = useState<Array<News>>([]); // 全ニュースデータ
  const [searchKeyword, setSearchKeyword] = useState(""); // 検索キーワード
  const [selectedDisplayLimit, setSelectedDisplayLimit] = useState(10); // 選択された表示件数
  const [displayLimit, setDisplayLimit] = useState(10); // 表示件数
  const [sortOrder, setSortOrder] = useState("desc"); // ソート順
  const [sortField, setSortField] = useState("newsDate"); // ソート基準
  const [isSearchVisible, setIsSearchVisible] = useState(false); // 検索欄の表示状態
  const [startDate, setStartDate] = useState("2019-09-24"); // フィルター開始日
  const [endDate, setEndDate] = useState(getJapaneseDate()); // フィルター終了日
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
            const limit =
              savedDisplayLimit === "all"
                  ? sortedData.length
                  : Number(savedDisplayLimit);
            setSelectedDisplayLimit(limit);
            setDisplayLimit(limit);
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

  // 検索キーワードを除く検索条件が変更されたときに検索を実行
  useEffect(() => {
    handleSearch();
  }, [selectedDisplayLimit, displayLimit, sortOrder, sortField, startDate, endDate]);

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

  // ソート基準を変更する
  const handleSortFieldChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      setSortField(event.target.value);
    }
  };

  // 表示件数を変更する
  const handleSelectedDisplayLimitChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      const newLimit =
        event.target.value === "all"
          ? allNewsData.length
          : Number(event.target.value);
      setSelectedDisplayLimit(newLimit);
      setDisplayLimit(newLimit);
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
      const aDate =
        sortField === "updated"
          ? new Date(a.updated).getTime()
          : parseDateString(a.newsDate);
      const bDate =
        sortField === "updated"
          ? new Date(b.updated).getTime()
          : parseDateString(b.newsDate);
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
    <div class="flex flex-col bg-white p-4 m-4 rounded-md">
      {isLoading ? (
        <div class="flex justify-center items-center p-4">
          <div class="w-8 h-8 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
          <span class="ml-3">データを取得しています...</span>
        </div>
      ) : (
        <>
          <button
            class={`p-2 m-2 border border-gray-600 rounded-md text-white ${
              isSearchVisible ? "bg-gray-500" : "bg-blue-500"
            }`}
            onClick={toggleSearchVisibility}
          >
            検索欄を{isSearchVisible ? "非表示" : "表示"}
          </button>

          {isSearchVisible && (
            <div class="p-4">
              <div>
                <label for="sortOrder">ソート順:</label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                >
                  <option value="desc">新しい順</option>
                  <option value="asc">古い順</option>
                </select>
              </div>
              <div>
                <label for="sortField">ソート基準:</label>
                <select
                  id="sortField"
                  value={sortField}
                  onChange={handleSortFieldChange}
                >
                  <option value="newsDate">投稿日</option>
                  <option value="updated">更新日</option>
                </select>
              </div>
              <div>
                <input
                  type="radio"
                  id="limit10"
                  name="displayLimit"
                  value="10"
                  checked={selectedDisplayLimit === 10}
                  onChange={handleSelectedDisplayLimitChange}
                />
                <label for="limit10">10件</label>
                <input
                  type="radio"
                  id="limit50"
                  name="displayLimit"
                  value="50"
                  checked={selectedDisplayLimit === 50}
                  onChange={handleSelectedDisplayLimitChange}
                />
                <label for="limit50">50件</label>
                <input
                  type="radio"
                  id="limit100"
                  name="displayLimit"
                  value="100"
                  checked={selectedDisplayLimit === 100}
                  onChange={handleSelectedDisplayLimitChange}
                />
                <label for="limit100">100件</label>
                <input
                  type="radio"
                  id="limitAll"
                  name="displayLimit"
                  value="all"
                  checked={selectedDisplayLimit === allNewsData.length}
                  onChange={handleSelectedDisplayLimitChange}
                />
                <label for="limitAll">全件</label>
              </div>
              <div class="flex flex-col">
                <div class="flex">
                  <input
                    type="text"
                    class="p-2 m-2 border border-gray-600 rounded-md flex-grow"
                    placeholder="(測定 OR 掃除) 開催 -予告"
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    class="p-2 m-2 border border-gray-600 rounded-md bg-blue-500 text-white"
                    onClick={handleSearch}
                  >
                    検索
                  </button>
                </div>
              </div>
              <div>
                <div class="flex items-center">
                  <div class="border border-gray-600 rounded-md p-2 m-2">
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={handleStartDateChange}
                    />
                  </div>
                  <span> ～ </span>
                  <div class="border border-gray-600 rounded-md p-2 ml-2">
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={handleEndDateChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div class="p-2 m-2">
            <span>おしらせの件数: {numberOfNews}件</span>
          </div>

          <ul>
            {newsData.map((news, index) => (
              <li
                key={index}
                class="p-2 m-2 hover:shadow-xl border border-gray-600 rounded-md"
              >
                <a
                  href={`https://kemono-friends-3.jp${news.targetUrl}`}
                  target="_blank"
                  class="flex flex-col justify-between"
                >
                  <p class="min-h-16 overflow-hidden text-base">{news.title}</p>
                  <span class="text-xs mt-auto">{news.newsDate.slice(0, 11)}</span>
                </a>
              </li>
            ))}
          </ul>

          {numberOfNews > displayLimit && (
            <button
              class="p-2 m-2 border border-gray-600 rounded-md bg-blue-500 text-white"
              onClick={handleLoadMore}
            >
              もっと見る
            </button>
          ) || null}
        </>
      )}
    </div>
  );
};

export default KemonoFriends3NewsSearch;