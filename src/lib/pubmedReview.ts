// PubMed(NCBI E-utilities)에서 주요 종합 의학저널의 최근 논문을 큐레이션한다.
// 별도 API 키 없이 사용 가능(저트래픽 기준).
//
// 의도적으로 LLM 한글 요약을 넣지 않는다: 이 서비스는 광고 수익 외 수익원이 없어 LLM API
// 비용을 지속적으로 감당할 방법이 없고, 개원의 독자들은 원문 제목만으로도 스스로 판단할
// 능력이 충분하다는 것이 운영자의 결정이다. 원문 제목/저널/링크만 제공한다.

export interface JournalArticle {
  pmid: string;
  title: string;
  journal: string;
  pubdate: string;
  link: string;
}

const TOP_JOURNALS = ['"N Engl J Med"[Journal]', '"JAMA"[Journal]', '"Lancet"[Journal]', '"Ann Intern Med"[Journal]', '"BMJ"[Journal]'];
// 서신(Letter)·논평(Comment)·저자 답신 등을 걸러내기 위해, 실제 연구 유형만 포함하도록 화이트리스트 방식으로 필터링한다.
const STUDY_TYPES = [
  '"Randomized Controlled Trial"[pt]',
  '"Clinical Trial"[pt]',
  '"Observational Study"[pt]',
  '"Meta-Analysis"[pt]',
  '"Systematic Review"[pt]',
  '"Practice Guideline"[pt]',
  '"Multicenter Study"[pt]',
];

function buildQuery() {
  return `(${TOP_JOURNALS.join(" OR ")}) AND ("last 30 days"[PDat]) AND (${STUDY_TYPES.join(" OR ")})`;
}

export async function getMedicalJournalReview(limit = 5): Promise<JournalArticle[]> {
  try {
    const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
    searchUrl.searchParams.set("db", "pubmed");
    searchUrl.searchParams.set("term", buildQuery());
    searchUrl.searchParams.set("sort", "pub date");
    searchUrl.searchParams.set("retmax", "15");
    searchUrl.searchParams.set("retmode", "json");

    const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 3600 * 6 } });
    if (!searchRes.ok) return [];
    const searchJson = await searchRes.json();
    const ids: string[] = searchJson?.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
    summaryUrl.searchParams.set("db", "pubmed");
    summaryUrl.searchParams.set("id", ids.join(","));
    summaryUrl.searchParams.set("retmode", "json");

    const summaryRes = await fetch(summaryUrl.toString(), { next: { revalidate: 3600 * 6 } });
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
        pubdate: item.pubdate ?? "",
        link: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`,
      }));

    return articles.slice(0, limit);
  } catch {
    return [];
  }
}
