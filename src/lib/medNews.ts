import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
}

const FEEDS: { url: string; source: string }[] = [
  { url: "https://www.docdocdoc.co.kr/rss/allArticle.xml", source: "청년의사" },
  { url: "https://www.monews.co.kr/rss/allArticle.xml", source: "메디칼업저버" },
  { url: "https://www.bosa.co.kr/rss/allArticle.xml", source: "의학신문" },
  { url: "https://www.mdtoday.co.kr/rss/allArticle.xml", source: "메디컬투데이" },
  { url: "https://www.medipana.com/rss/allArticle.xml", source: "메디파나뉴스" },
  { url: "https://www.hkn24.com/rss/allArticle.xml", source: "헬스코리아뉴스" },
  { url: "https://www.rapportian.com/rss/allArticle.xml", source: "라포르시안" },
];

const parser = new Parser({ timeout: 8000 });

function stripTags(text: string) {
  return text.replace(/<[^>]+>/g, "").trim();
}

export async function getMedicalNews(limitPerFeed = 2, total = 10): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).slice(0, limitPerFeed).map((item) => ({
        title: stripTags(item.title ?? ""),
        link: item.link ?? "",
        pubDate: item.pubDate ?? null,
        source: feed.source,
      }));
    })
  );

  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  return items
    .filter((it) => it.title && it.link)
    .sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return tb - ta;
    })
    .slice(0, total);
}
