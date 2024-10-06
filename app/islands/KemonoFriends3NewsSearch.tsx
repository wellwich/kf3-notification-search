import { useEffect, useState } from "hono/jsx";
import { newsArraySchema, News } from "../schema";

// ニュースデータの検索・表示コンポーネント
const KemonoFriends3NewsSearch = () => {
  const [newsData, setNewsData] = useState<Array<News>>([]); // 表示されるニュースデータ
  const [allNewsData, setAllNewsData] = useState<Array<News>>([]); // 全ニュースデータ
  const [searchKeyword, setSearchKeyword] = useState(""); // 検索キーワード
  const [displayLimit, setDisplayLimit] = useState(10); // 表示件数
  const [sortOrder, setSortOrder] = useState("desc"); // ソート順
  const [sortField, setSortField] = useState("newsDate"); // ソート基準
  const [isSearchVisible, setIsSearchVisible] = useState(false); // 検索欄の表示状態

  // コンポーネント初回レンダリング時にニュースデータを取得
  useEffect(() => {
    fetch("/api/kf3-news")
      .then((res) => res.json())
      .then((data) => {
        const result = newsArraySchema.safeParse(data);
        if (result.success) {
          setAllNewsData(result.data); // 全データをセット
          setNewsData(getSortedNews(result.data.slice(0, displayLimit))); // 初期表示データをセット
        } else {
          console.error("Data validation failed", result.error);
        }
      });
  }, [displayLimit]);

  // 検索キーワードの変更をハンドリング
  const handleSearchChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      setSearchKeyword(event.target.value);
    }
  };

  // 検索を実行する関数
  const handleSearch = () => {
    const filteredNews = filterNewsByKeyword(allNewsData, searchKeyword);
    setNewsData(getSortedNews(filteredNews.slice(0, displayLimit)));
  };

  // 「もっと見る」ボタンを押した時の処理
  const handleLoadMore = () => {
    setDisplayLimit((prevLimit) => prevLimit + 10);
    const filteredNews = filterNewsByKeyword(allNewsData, searchKeyword);
    setNewsData(getSortedNews(filteredNews.slice(0, displayLimit + 10)));
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
  const handleDisplayLimitChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      const newLimit =
        event.target.value === "all"
          ? allNewsData.length
          : Number(event.target.value);
      setDisplayLimit(newLimit);
    }
  };

  // 検索欄の表示・非表示を切り替える
  const toggleSearchVisibility = () => {
    setIsSearchVisible((prev) => !prev);
  };

  // ニュースデータをキーワードでフィルター
  const filterNewsByKeyword = (newsArray: Array<News>, keyword: string) =>
    newsArray.filter((news) => news.title.includes(keyword));

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
      <h2 class="text-3xl font-bold">お知らせ</h2>
      <button
        class={`p-2 m-2 border border-gray-600 rounded-md text-white ${
          isSearchVisible ? "bg-gray-500" : "bg-blue-500"
        }`}
        onClick={toggleSearchVisibility}
      >
        検索欄を{isSearchVisible ? "非表示" : "表示"}
      </button>

      {isSearchVisible && (
        <div>
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
              checked={displayLimit === 10}
              onChange={handleDisplayLimitChange}
            />
            <label for="limit10">10件</label>
            <input
              type="radio"
              id="limit50"
              name="displayLimit"
              value="50"
              checked={displayLimit === 50}
              onChange={handleDisplayLimitChange}
            />
            <label for="limit50">50件</label>
            <input
              type="radio"
              id="limit100"
              name="displayLimit"
              value="100"
              checked={displayLimit === 100}
              onChange={handleDisplayLimitChange}
            />
            <label for="limit100">100件</label>
            <input
              type="radio"
              id="limitAll"
              name="displayLimit"
              value="all"
              checked={displayLimit === allNewsData.length}
              onChange={handleDisplayLimitChange}
            />
            <label for="limitAll">全件</label>
          </div>
          <input
            type="text"
            class="p-2 m-2 border border-gray-600 rounded-md"
            placeholder="検索"
            value={searchKeyword}
            onChange={handleSearchChange}
          />
          <button
            class="p-2 m-2 border border-gray-600 rounded-md bg-blue-500 text-white"
            onClick={handleSearch}
          >
            検索
          </button>
        </div>
      )}

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
              <p class="h-16 overflow-hidden text-base">{news.title}</p>
              <span class="text-xs mt-auto">{news.newsDate.slice(0, 10)}</span>
            </a>
          </li>
        ))}
      </ul>

      {allNewsData.filter((news) => news.title.includes(searchKeyword)).length >
        displayLimit && (
        <button
          class="p-2 m-2 border border-gray-600 rounded-md bg-blue-500 text-white"
          onClick={handleLoadMore}
        >
          もっと見る
        </button>
      )}
    </div>
  );
};

export default KemonoFriends3NewsSearch;
