import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import {
  AdvertisementSection,
  ClinicalEnglishSection,
  DailyQuoteSection,
  HyperSoapSection,
  JournalSection,
  MarketSection,
  MedicalNewsSection,
  MediLogSection,
  NoticeSection,
  TaxCalendarSection,
  WeatherSection,
} from "@/components/briefing-sections";
import { getBitcoin } from "@/lib/bitcoin";
import { getDailyEnglishPhrase } from "@/lib/dailyEnglishPhrase";
import { getUsdKrw } from "@/lib/fx";
import { getKospi } from "@/lib/kospi";
import { kstNow } from "@/lib/kst";
import { getMedicalNews } from "@/lib/medNews";
import { getNasdaq } from "@/lib/nasdaq";
import { getNotice } from "@/lib/notice";
import { getMedicalJournalReview } from "@/lib/pubmedReview";
import { getTodayMovieQuote, getTodayQuote } from "@/lib/quotes";
import { getSectionConfig, type SectionId } from "@/lib/section-config";
import { getUpcomingDeadlines } from "@/lib/taxDeadlines";
import { getWeeklyWeather } from "@/lib/weather";

// 이 페이지는 정적 export로 빌드된다(GitHub Pages는 서버 런타임이 없음).
// 데이터와 코너 설정은 GitHub Actions가 사이트를 다시 빌드할 때 반영된다.

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function formatToday(d: Date) {
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${WEEKDAY_KR[d.getUTCDay()]})`;
}

export default async function SectionPage() {
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
  const movieQuote = getTodayMovieQuote(today);
  const dailyPhrase = getDailyEnglishPhrase(today);
  const notice = getNotice();
  const sectionConfig = getSectionConfig();

  const sectionViews: Record<SectionId, ReactNode> = {
    "daily-quote": <DailyQuoteSection quote={quote} movieQuote={movieQuote} />,
    weather: <WeatherSection weather={weather} />,
    market: <MarketSection fx={fx} kospi={kospi} nasdaq={nasdaq} bitcoin={bitcoin} />,
    medilog: <MediLogSection today={today} />,
    "tax-calendar": <TaxCalendarSection deadlines={deadlines} />,
    "medical-news": <MedicalNewsSection news={news} />,
    journal: <JournalSection journalReview={journalReview} />,
    "clinical-english": <ClinicalEnglishSection dailyPhrase={dailyPhrase} />,
    "hyper-soap": <HyperSoapSection />,
    notice: <NoticeSection notice={notice} />,
    advertisement: <AdvertisementSection />,
  };

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6 text-center">
        <a
          href="https://hyperdoctor.app/"
          aria-label="Hyperdoctor 전체 도구 홈"
          className="mb-3 inline-flex items-center gap-2 rounded-xl text-sm font-bold text-[#2E7D6E] outline-none ring-offset-4 focus-visible:ring-2 focus-visible:ring-[#2E7D6E]"
        >
          <Image
            src="/hyperdoctor-icon-512.svg"
            alt=""
            aria-hidden="true"
            width={48}
            height={48}
            priority
          />
          <span>Hyperdoctor</span>
        </a>
        <p className="text-sm text-slate-500">{formatToday(today)}</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900">🩺 개원의 정석 데일리 브리핑</h1>
        <p className="mt-1 text-xs text-slate-400">
          정성웅 · 서울W내과 대표원장 · 『개원의 정석』 저자
        </p>
      </header>

      {sectionConfig.sections
        .filter((section) => section.visible)
        .map((section) => <Fragment key={section.id}>{sectionViews[section.id]}</Fragment>)}

      <footer className="text-center text-[11px] leading-relaxed text-slate-400">
        <p>정성웅 · 서울W내과 대표원장 · 『개원의 정석』 저자</p>
        <p className="mt-1">© {today.getUTCFullYear()} 개원의 정석 ver2.0</p>
        <a
          href="https://hyperdoctor.app/"
          className="mt-2 inline-block font-semibold text-[#2E7D6E] underline-offset-4 hover:underline focus-visible:underline"
        >
          Hyperdoctor 전체 도구
        </a>
      </footer>
    </main>
  );
}
