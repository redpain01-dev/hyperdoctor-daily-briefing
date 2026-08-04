// PubMed(NCBI E-utilities)에서 주요 해외 의학저널의 최근 논문을 가져온다.
// 정적 사이트이므로 매일 GitHub Actions가 다시 빌드할 때 목록이 갱신된다.

export interface JournalArticle {
  pmid: string;
  title: string;
  journal: string;
  pubdate: string;
  studyType: string;
  link: string;
}

// 종합저널뿐 아니라 개원의가 자주 접하는 주요 임상 분야 저널까지 포함한다.
const JOURNALS = [
  "N Engl J Med",
  "JAMA",
  "Lancet",
  "BMJ",
  "Ann Intern Med",
  "JAMA Intern Med",
  "JAMA Netw Open",
  "Nat Med",
  "Circulation",
  "Eur Heart J",
  "J Am Coll Cardiol",
  "Diabetes Care",
  "Gastroenterology",
  "Gut",
  "Chest",
  "Am J Respir Crit Care Med",
  "Neurology",
  "J Clin Oncol",
  "JAMA Oncol",
  "Kidney Int",
];

const EXCLUDED_PUBLICATION_TYPES = [
  '"Editorial"[pt]',
  '"Comment"[pt]',
  '"Letter"[pt]',
  '"News"[pt]',
  '"Published Erratum"[pt]',
  '"Retracted Publication"[pt]',
  '"Retraction of Publication"[pt]',
];

function getKstCalendarDate(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
}

function buildQuery() {
  const journalQuery = JOURNALS.map((journal) => `"${journal}"[ta]`).join(" OR ");

  // publication type 태그가 아직 붙지 않은 온라인 선게재 논문도 놓치지 않도록
  // 연구 유형 화이트리스트 대신 초록 보유 + 비연구성 문서 제외 방식을 사용한다.
  return `(${journalQuery}) AND hasabstract NOT (${EXCLUDED_PUBLICATION_TYPES.join(" OR ")})`;
}

function getStudyType(publicationTypes: unknown): string {
  if (!Array.isArray(publicationTypes)) return "최신 연구";

  const types = publicationTypes.filter((type): type is string => typeof type === "string");
  if (types.includes("Randomized Controlled Trial")) return "무작위 임상시험";
  if (types.includes("Meta-Analysis")) return "메타분석";
  if (types.includes("Systematic Review")) return "체계적 문헌고찰";
  if (types.includes("Practice Guideline") || types.includes("Guideline")) return "진료지침";
  if (types.includes("Clinical Trial")) return "임상시험";
  if (types.includes("Observational Study")) return "관찰연구";
  if (types.includes("Case Reports")) return "증례";
  if (types.includes("Review")) return "리뷰";
  return "최신 연구";
}

const MONTH_INDEX: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

function parsePubdate(value: unknown): Date | null {
  if (typeof value !== "string") return null;

  const numeric = value.match(/^(\d{4})[\/-](\d{1,2})(?:[\/-](\d{1,2}))?/);
  if (numeric) {
    return new Date(Date.UTC(Number(numeric[1]), Number(numeric[2]) - 1, Number(numeric[3] ?? 1)));
  }

  const namedMonth = value.match(/^(\d{4})\s+([A-Z][a-z]{2})(?:\s+(\d{1,2}))?/);
  if (namedMonth && MONTH_INDEX[namedMonth[2]]) {
    return new Date(
      Date.UTC(Number(namedMonth[1]), MONTH_INDEX[namedMonth[2]] - 1, Number(namedMonth[3] ?? 1))
    );
  }

  return null;
}

function displayPubdate(epubdate: unknown, sortPubdate: unknown, pubdate: unknown): string {
  const today = getKstCalendarDate();

  // 미래 인쇄 호수 날짜보다 실제 온라인 공개일(epubdate)을 우선한다.
  for (const candidate of [epubdate, sortPubdate, pubdate]) {
    const parsed = parsePubdate(candidate);
    if (parsed && parsed <= today) {
      return `${parsed.getUTCFullYear()}.${String(parsed.getUTCMonth() + 1).padStart(2, "0")}.${String(
        parsed.getUTCDate()
      ).padStart(2, "0")}`;
    }
  }

  return "";
}

// 최신 3편은 고정하고 나머지는 KST 날짜별로 순환해 매일 다른 논문을 발견할 수 있게 한다.
function selectDailyArticles(articles: JournalArticle[], limit: number, now = new Date()) {
  const unique = articles.filter(
    (article, index, all) =>
      all.findIndex((candidate) => candidate.title.toLowerCase() === article.title.toLowerCase()) === index
  );
  if (unique.length <= limit) return unique;

  const anchorCount = Math.min(3, limit);
  const selected: JournalArticle[] = [];
  const anchorJournals = new Set<string>();

  // 접힌 상태에서도 서로 다른 분야가 보이도록 최신 논문 중 저널이 겹치지 않게 고른다.
  for (const article of unique) {
    if (selected.length >= anchorCount) break;
    if (!anchorJournals.has(article.journal)) {
      selected.push(article);
      anchorJournals.add(article.journal);
    }
  }

  const selectedPmids = new Set(selected.map((article) => article.pmid));
  const pool = unique.filter((article) => !selectedPmids.has(article.pmid));
  const today = getKstCalendarDate(now);
  const daySeed = Math.floor(today.getTime() / 86_400_000);
  const offset = daySeed % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const seenJournals = new Set(selected.map((article) => article.journal));

  // 먼저 서로 다른 저널을 채우고, 자리가 남으면 최신순 순환 목록으로 보충한다.
  for (const article of rotated) {
    if (selected.length >= limit) break;
    if (!seenJournals.has(article.journal)) {
      selected.push(article);
      seenJournals.add(article.journal);
    }
  }
  for (const article of rotated) {
    if (selected.length >= limit) break;
    if (!selected.some((candidate) => candidate.pmid === article.pmid)) selected.push(article);
  }

  return selected;
}

export async function getMedicalJournalReview(limit = 10): Promise<JournalArticle[]> {
  try {
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", buildQuery());
    searchUrl.searchParams.set("datetype", "edat");
    searchUrl.searchParams.set("reldate", "90");
    searchUrl.searchParams.set("retmax", String(Math.max(200, limit * 20)));
    searchUrl.searchParams.set("retmode", "json");
    searchUrl.searchParams.set("tool", "hyperdoctor_daily_briefing");

    const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 3600 * 6 } });
    if (!searchRes.ok) return [];
    const searchJson = await searchRes.json();
    const ids: string[] = searchJson?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryParams = new URLSearchParams({
      db: "pubmed",
      id: ids.join(","),
      retmode: "json",
      tool: "hyperdoctor_daily_briefing",
    });
    const summaryRes = await fetch(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: summaryParams.toString(),
        next: { revalidate: 3600 * 6 },
      }
    );
    if (!summaryRes.ok) return [];
    const summaryJson = await summaryRes.json();
    const uids: string[] = summaryJson?.result?.uids ?? [];

    const articles: JournalArticle[] = uids
      .map((uid) => summaryJson.result[uid])
      .filter((item) => item && typeof item.title === "string" && item.title.replace(/\.$/, "").length >= 20)
      .map((item) => ({
        pmid: item.uid,
        title: item.title.replace(/<[^>]+>/g, ""),
        journal: item.source ?? "",
        pubdate: displayPubdate(item.epubdate, item.sortpubdate, item.pubdate),
        studyType: getStudyType(item.pubtype),
        link: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      }))
      .filter((article) => article.pubdate !== "")
      .sort((a, b) => b.pubdate.localeCompare(a.pubdate));

    return selectDailyArticles(articles, limit);
  } catch {
    return [];
  }
}
