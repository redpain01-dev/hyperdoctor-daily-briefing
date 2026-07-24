import { getUsdKrw } from "@/lib/fx";
import { getKospi } from "@/lib/kospi";
import { getNasdaq } from "@/lib/nasdaq";
import { getBitcoin } from "@/lib/bitcoin";
import { getWeeklyWeather } from "@/lib/weather";
import { getUpcomingDeadlines } from "@/lib/taxDeadlines";
import { getTodayQuote } from "@/lib/quotes";
import { getMedicalNews } from "@/lib/medNews";
import { getMedicalJournalReview } from "@/lib/pubmedReview";
import { getNotice } from "@/lib/notice";
import { kstNow } from "@/lib/kst";

// 이 페이지는 정적 export로 빌드된다(GitHub Pages는 서버 런타임이 없음).
// 따라서 여기서의 데이터 최신화는 요청 시점이 아니라 GitHub Actions가
// 매일 새벽 이 사이트를 다시 빌드·배포하는 방식으로 이루어진다.
// (.github/workflows/deploy.yml 참고)

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

// d는 kstNow()로 만든 값이라는 전제 하에 getUTC*()로만 읽어야 KST 기준 날짜가 나온다.
function formatToday(d: Date) {
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${
    WEEKDAY_KR[d.getUTCDay()]
  })`;
}

function formatSigned(n: number, digits = 2) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  return `${sign}${n.toFixed(digits)}`;
}

export default async function Home() {
  const today = kstNow();

  const [fx, kospi, nasdaq, bitcoin, weather, news, journalReview] = await Promise.all([
    getUsdKrw(),
    getKospi(),
    getNasdaq(),
    getBitcoin(),
    getWeeklyWeather(),
    getMedicalNews(),
    getMedicalJournalReview(),
  ]);
  const deadlines = getUpcomingDeadlines(today);
  const quote = getTodayQuote(today);
  const notice = getNotice();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6 text-center">
        <p className="text-sm text-slate-500">{formatToday(today)}</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">
          🩺 개원의 정석 데일리 브리핑
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          정성웅 · 서울W내과 대표원장 · 『개원의 정석』 저자
        </p>
      </header>

      {/* 오늘의 명언 */}
      <section className="mb-5 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-slate-100">
        <p className="text-xs font-semibold text-blue-500">오늘의 한마디</p>
        <p className="mt-2 text-base font-medium leading-relaxed text-slate-800">
          “{quote.text}”
        </p>
        <p className="mt-2 text-xs text-slate-400">— {quote.author}</p>
      </section>

      {/* 날씨 */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">🌤️ 이번 주 날씨 (서울)</h2>
        {weather ? (
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            {weather.map((d) => (
              <div
                key={d.date}
                className="flex min-w-[64px] flex-col items-center rounded-xl bg-slate-50 px-2 py-3"
              >
                <span className="text-xs font-semibold text-slate-500">{d.label}</span>
                <span className="mt-1 text-2xl leading-none">{d.icon}</span>
                <span className="mt-1 text-xs text-slate-600">{d.skyText}</span>
                <span className="mt-2 text-xs text-blue-500">
                  {d.pop !== null ? `${d.pop}%` : "-"}
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-800">
                  {d.tmax !== null ? `${Math.round(d.tmax)}°` : "-"}
                  <span className="ml-1 font-normal text-slate-400">
                    {d.tmin !== null ? `${Math.round(d.tmin)}°` : "-"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-700">
            날씨 API 키가 설정되지 않았습니다. 공공데이터포털에서 기상청 단기예보·중기예보
            서비스키를 발급받아 <code className="rounded bg-amber-100 px-1">KMA_SERVICE_KEY</code>{" "}
            환경변수에 등록해주세요.
          </p>
        )}
      </section>

      {/* 경제 지표 */}
      <section className="mb-5 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
          <div className="p-3 text-center">
            <p className="text-[11px] text-slate-400">원/달러</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {fx ? fx.rate.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) : "-"}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-[11px] text-slate-400">코스피</p>
            {kospi ? (
              <>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {kospi.price.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
                </p>
                <p className={`text-[11px] ${kospi.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                  {formatSigned(kospi.changePercent, 2)}%
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm font-bold text-slate-400">-</p>
            )}
          </div>
          <div className="p-3 text-center">
            <p className="text-[11px] text-slate-400">나스닥</p>
            {nasdaq ? (
              <>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {nasdaq.price.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
                </p>
                <p className={`text-[11px] ${nasdaq.change >= 0 ? "text-red-500" : "text-blue-500"}`}>
                  {formatSigned(nasdaq.changePercent, 2)}%
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm font-bold text-slate-400">-</p>
            )}
          </div>
          <div className="p-3 text-center">
            <p className="text-[11px] text-slate-400">비트코인(USD)</p>
            {bitcoin ? (
              <>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  ${Math.round(bitcoin.priceUsd).toLocaleString("en-US")}
                </p>
                <p
                  className={`text-[11px] ${
                    bitcoin.changePercent24h >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {formatSigned(bitcoin.changePercent24h, 2)}%
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm font-bold text-slate-400">-</p>
            )}
          </div>
        </div>
      </section>

      {/* 세무·행정 마감일 */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">📋 세무·행정 마감일</h2>
        <ul className="divide-y divide-slate-100">
          {deadlines.map((dl) => (
            <li key={dl.name} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{dl.name}</p>
                <p className="text-[11px] text-slate-400">{dl.description}</p>
              </div>
              <span
                className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  dl.dday <= 7
                    ? "bg-red-50 text-red-500"
                    : dl.dday <= 30
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {dl.dday === 0 ? "D-DAY" : `D-${dl.dday}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          * 개인사업자(의원) 기준 대표 일정입니다. 정확한 일정은 관할 세무서 또는 담당
          세무사와 반드시 다시 확인해주세요.
        </p>
      </section>

      {/* 의료계 뉴스 */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">📰 의료계 소식</h2>
        {news.length > 0 ? (
          <ul className="space-y-3">
            {news.map((item) => (
              <li key={item.link}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-sm font-medium leading-snug text-slate-800 hover:text-blue-600">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.source}</p>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">오늘의 소식을 불러오지 못했습니다.</p>
        )}
      </section>

      {/* 최신 의학저널 리뷰 */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">📚 최신 해외 의학저널</h2>
        {journalReview.length > 0 ? (
          <ul className="space-y-3">
            {journalReview.map((item) => (
              <li key={item.pmid}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <p className="text-sm font-medium leading-snug text-slate-800 hover:text-blue-600">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {item.journal} · {item.pubdate}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">오늘의 저널 리뷰를 불러오지 못했습니다.</p>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          * NEJM·JAMA·Lancet·Ann Intern Med·BMJ 최근 게재 논문 제목입니다. 요약이 아닌 원문
          링크이므로 임상 판단 시 원문을 직접 확인해주세요.
        </p>
      </section>

      {/* 방장 공지 */}
      {notice.enabled && (
        <section className="mb-5 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100">
          <p className="text-xs font-semibold text-blue-600">📢 {notice.title}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {notice.message}
          </p>
          {notice.linkUrl && (
            <a
              href={notice.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              {notice.linkLabel} →
            </a>
          )}
        </section>
      )}

      {/* 애드센스 자리 */}
      <section className="mb-5 flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-300">
        광고 영역 (Google AdSense)
      </section>

      <footer className="text-center text-[11px] leading-relaxed text-slate-400">
        <p>정성웅 · 서울W내과 대표원장 · 『개원의 정석』 저자</p>
        <p className="mt-1">© {today.getUTCFullYear()} 개원의 정석 ver2.0</p>
      </footer>
    </main>
  );
}
