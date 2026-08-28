import Image from "next/image";
import { getDailyEnglishPhrase } from "@/lib/dailyEnglishPhrase";
import type { NewsItem } from "@/lib/medNews";
import type { Notice, NoticeBlock, NoticeSpan } from "@/lib/notice";
import type { JournalArticle } from "@/lib/pubmedReview";
import { getTodayMovieQuote, getTodayQuote } from "@/lib/quotes";
import type { TaxDeadline } from "@/lib/taxDeadlines";
import type { DailyWeather } from "@/lib/weather";

const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];
const MEDILOG_URL = "https://medilog.hyperdoctor.app/";
const HYPER_SOAP_URL = "https://soap.hyperdoctor.app/?utm_source=daily-briefing&utm_medium=feature-card&utm_campaign=hyper-soap-demo";
const JOURNAL_PREVIEW_COUNT = 3;

type Quote = ReturnType<typeof getTodayQuote>;
type MovieQuote = ReturnType<typeof getTodayMovieQuote>;
type DailyPhrase = ReturnType<typeof getDailyEnglishPhrase>;

function formatSigned(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthCalendar(today: Date) {
  const year = today.getUTCFullYear();
  const monthIndex = today.getUTCMonth();
  const todayKey = formatDateKey(year, monthIndex, today.getUTCDate());
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return {
    year,
    month: monthIndex + 1,
    todayKey,
    cells: Array.from({ length: cellCount }, (_, index) => {
      const day = index - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) return null;
      return { day, weekday: index % 7, dateKey: formatDateKey(year, monthIndex, day) };
    }),
  };
}

function NoticeInline({ spans }: { spans: NoticeSpan[] }) {
  return spans.map((span, index) => {
    let content: React.ReactNode = span.text;
    for (const mark of span.marks ?? []) {
      if (mark.type === "bold") content = <strong>{content}</strong>;
      if (mark.type === "link") content = <a href={mark.href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2">{content}</a>;
    }
    return <span key={`${span.text}-${index}`}>{content}</span>;
  });
}

function NoticeContent({ blocks }: { blocks: NoticeBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") return <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700" key={`paragraph-${index}`}><NoticeInline spans={block.children} /></p>;
    if (block.type === "quote") return <blockquote className="mt-3 border-l-2 border-blue-300 pl-3 text-sm leading-relaxed text-slate-600" key={`quote-${index}`}><NoticeInline spans={block.children} /></blockquote>;
    if (block.type === "bulletList") return <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700" key={`list-${index}`}>{block.items.map((item, itemIndex) => <li key={itemIndex}><NoticeInline spans={item} /></li>)}</ul>;
    return <figure className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100" key={block.id}><Image src={block.src} alt={block.alt} width={block.width} height={block.height} sizes="(max-width: 640px) calc(100vw - 72px), 408px" className="h-auto w-full" />{block.caption && <figcaption className="px-3 py-2 text-[11px] leading-relaxed text-slate-500">{block.caption}</figcaption>}</figure>;
  });
}

function JournalArticleItem({ item }: { item: JournalArticle }) {
  return <li><a href={item.link} target="_blank" rel="noopener noreferrer" className="group/article block"><p className="text-sm font-medium leading-snug text-slate-800 transition-colors group-hover/article:text-blue-600">{item.title}</p><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400"><span>{item.journal}</span><span aria-hidden="true">·</span><span>{item.pubdate}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">{item.studyType}</span></div></a></li>;
}

export function DailyQuoteSection({ quote, movieQuote }: { quote: Quote; movieQuote: MovieQuote }) {
  return <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"><div className="px-5 py-5 text-center"><p className="text-xs font-semibold text-teal-600">오늘의 한마디</p><p className="mt-2 text-base font-medium leading-relaxed text-slate-800">“{quote.text}”</p><p className="mt-2 text-xs text-slate-400">{quote.author === "데일리 브리핑" ? "✦ 개원의 정석 편집 문장" : `— ${quote.author}`}</p></div><div className="border-t border-amber-100 bg-amber-50/70 px-5 py-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-amber-700">🎬 오늘의 명대사</p><span className="shrink-0 text-[10px] font-medium text-amber-600/70">{movieQuote.country} · {movieQuote.year}</span></div><blockquote className="mt-2 text-sm font-medium leading-relaxed text-slate-700">“{movieQuote.text}”</blockquote><p className="mt-2 text-right text-[11px] text-slate-500">— 〈{movieQuote.movie}〉</p><p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs leading-relaxed text-amber-900/70"><span className="font-semibold text-amber-700">오늘의 울림</span> · {movieQuote.resonance}</p></div></section>;
}

export function WeatherSection({ weather }: { weather: DailyWeather[] | null }) {
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="mb-3 text-sm font-semibold text-slate-700">🌤️ 이번 주 날씨 (서울)</h2>{weather ? <><div className="-mx-1 flex gap-2 overflow-x-auto pb-1">{weather.map((day) => <div key={day.date} className="flex min-w-[64px] flex-col items-center rounded-xl bg-slate-50 px-2 py-3"><span className="text-xs font-semibold text-slate-500">{day.label}</span><span className="mt-1 text-2xl leading-none">{day.icon}</span><span className="mt-1 text-xs text-slate-600">{day.skyText}</span><span className="mt-2 text-xs text-blue-500">{day.pop !== null ? `${day.pop}%` : "-"}</span><span className="mt-1 text-xs font-semibold text-slate-800">{day.tmax !== null ? `${Math.round(day.tmax)}°` : "-"}<span className="ml-1 font-normal text-slate-400">{day.tmin !== null ? `${Math.round(day.tmin)}°` : "-"}</span></span></div>)}</div><p className="mt-2 text-right text-[10px] text-slate-300">예보: {weather.some((day) => day.source === "기상청") ? "기상청" : "Open-Meteo"}{weather.some((day) => day.source === "기상청") && weather.some((day) => day.source === "Open-Meteo") ? " · 일부 날짜 보완" : ""}</p></> : <p className="rounded-xl bg-amber-50 px-3 py-3 text-xs leading-relaxed text-amber-700">날씨 정보를 일시적으로 불러오지 못했습니다. 다음 자동 갱신에서 다시 시도합니다.</p>}</section>;
}

type MarketProps = { fx: { rate: number } | null; kospi: { price: number; change: number; changePercent: number } | null; nasdaq: { price: number; change: number; changePercent: number } | null; bitcoin: { priceUsd: number; changePercent24h: number } | null };

export function MarketSection({ fx, kospi, nasdaq, bitcoin }: MarketProps) {
  return <section className="mb-5 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"><div className="grid grid-cols-2 divide-x divide-y divide-slate-100"><div className="p-3 text-center"><p className="text-[11px] text-slate-400">원/달러</p><p className="mt-1 text-sm font-bold text-slate-800">{fx ? fx.rate.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) : "-"}</p></div><div className="p-3 text-center"><p className="text-[11px] text-slate-400">코스피</p>{kospi ? <><p className="mt-1 text-sm font-bold text-slate-800">{kospi.price.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</p><p className={`text-[11px] ${kospi.change >= 0 ? "text-red-500" : "text-blue-500"}`}>{formatSigned(kospi.changePercent)}%</p></> : <p className="mt-1 text-sm font-bold text-slate-400">-</p>}</div><div className="p-3 text-center"><p className="text-[11px] text-slate-400">나스닥</p>{nasdaq ? <><p className="mt-1 text-sm font-bold text-slate-800">{nasdaq.price.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</p><p className={`text-[11px] ${nasdaq.change >= 0 ? "text-red-500" : "text-blue-500"}`}>{formatSigned(nasdaq.changePercent)}%</p></> : <p className="mt-1 text-sm font-bold text-slate-400">-</p>}</div><div className="p-3 text-center"><p className="text-[11px] text-slate-400">비트코인(USD)</p>{bitcoin ? <><p className="mt-1 text-sm font-bold text-slate-800">${Math.round(bitcoin.priceUsd).toLocaleString("en-US")}</p><p className={`text-[11px] ${bitcoin.changePercent24h >= 0 ? "text-red-500" : "text-blue-500"}`}>{formatSigned(bitcoin.changePercent24h)}%</p></> : <p className="mt-1 text-sm font-bold text-slate-400">-</p>}</div></div></section>;
}

export function MediLogSection({ today }: { today: Date }) {
  const calendar = getMonthCalendar(today);
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-slate-700">📓 MediLog 월간 다이어리</h2><p className="mt-1 text-[11px] leading-relaxed text-slate-400">날짜를 누르면 메디로그의 해당 날짜 기록장이 바로 열립니다.</p></div><span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-semibold text-teal-700">{calendar.year}.{String(calendar.month).padStart(2, "0")}</span></div><div className="mt-4 grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">{WEEKDAY_KR.map((weekday, index) => <span key={weekday} className={index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : ""}>{weekday}</span>)}</div><div className="mt-2 grid grid-cols-7 gap-1">{calendar.cells.map((cell, index) => cell ? <a key={cell.dateKey} href={`${MEDILOG_URL}?date=${cell.dateKey}&view=day&utm_source=daily-briefing&utm_medium=calendar`} target="_blank" rel="noopener noreferrer" aria-label={`${calendar.month}월 ${cell.day}일 메디로그 기록장 열기`} className={`flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${cell.dateKey === calendar.todayKey ? "bg-teal-700 text-white shadow-sm" : cell.weekday === 0 ? "text-red-500 hover:bg-red-50" : cell.weekday === 6 ? "text-blue-500 hover:bg-blue-50" : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"}`}>{cell.day}</a> : <span key={`empty-${index}`} aria-hidden="true" className="h-9" />)}</div><a href={`${MEDILOG_URL}?date=${calendar.todayKey}&view=month&utm_source=daily-briefing&utm_medium=button`} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">메디로그에서 월간 다이어리 열기 →</a></section>;
}

export function TaxCalendarSection({ deadlines }: { deadlines: TaxDeadline[] }) {
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="mb-3 text-sm font-semibold text-slate-700">📋 세무·행정 마감일</h2><ul className="divide-y divide-slate-100">{deadlines.map((deadline) => <li key={deadline.name} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium text-slate-800">{deadline.name}</p><p className="text-[11px] text-slate-400">{deadline.description}</p></div><span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${deadline.dday <= 7 ? "bg-red-50 text-red-500" : deadline.dday <= 30 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>{deadline.dday === 0 ? "D-DAY" : `D-${deadline.dday}`}</span></li>)}</ul><p className="mt-3 text-[11px] leading-relaxed text-slate-400">* 개인사업자(의원) 기준 대표 일정입니다. 정확한 일정은 관할 세무서 또는 담당 세무사와 반드시 다시 확인해주세요.</p></section>;
}

export function MedicalNewsSection({ news }: { news: NewsItem[] }) {
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><h2 className="mb-3 text-sm font-semibold text-slate-700">📰 의료계 소식</h2>{news.length > 0 ? <ul className="space-y-3">{news.map((item) => <li key={item.link}><a href={item.link} target="_blank" rel="noopener noreferrer" className="block"><p className="text-sm font-medium leading-snug text-slate-800 hover:text-blue-600">{item.title}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.source}</p></a></li>)}</ul> : <p className="text-xs text-slate-400">오늘의 소식을 불러오지 못했습니다.</p>}</section>;
}

export function JournalSection({ journalReview }: { journalReview: JournalArticle[] }) {
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-700">📚 최신 해외 의학저널</h2>{journalReview.length > 0 && <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">오늘 {journalReview.length}편</span>}</div>{journalReview.length > 0 ? <><ul className="space-y-3">{journalReview.slice(0, JOURNAL_PREVIEW_COUNT).map((item) => <JournalArticleItem key={item.pmid} item={item} />)}</ul>{journalReview.length > JOURNAL_PREVIEW_COUNT && <details className="group mt-3 border-t border-slate-100 pt-3"><summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">나머지 {journalReview.length - JOURNAL_PREVIEW_COUNT}편 펼쳐보기</span><span className="hidden group-open:inline">논문 목록 접기</span><span aria-hidden="true" className="inline-block transition-transform duration-200 group-open:rotate-180">▾</span></summary><ul className="mt-3 space-y-3">{journalReview.slice(JOURNAL_PREVIEW_COUNT).map((item) => <JournalArticleItem key={item.pmid} item={item} />)}</ul></details>}</> : <p className="text-xs text-slate-400">오늘의 저널 리뷰를 불러오지 못했습니다.</p>}<p className="mt-3 text-[11px] leading-relaxed text-slate-400">* 종합·내과·심혈관·호흡기·소화기·종양·신경·신장 등 주요 저널의 최근 논문 중 초록이 있는 연구를 PubMed에서 선별합니다. 매일 일부 항목이 바뀌며, 임상 판단 시 원문을 직접 확인해주세요.</p></section>;
}

export function ClinicalEnglishSection({ dailyPhrase }: { dailyPhrase: DailyPhrase }) {
  return <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-700">🗣️ 오늘의 진료영어 한마디</h2><span className="text-[11px] text-slate-400">{dailyPhrase.fieldKo}</span></div><p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">{dailyPhrase.en}</p><p className="mt-1.5 text-xs leading-relaxed text-slate-500">{dailyPhrase.ko}</p><a href="https://english.hyperdoctor.app/daily" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white">Rapport에서 듣고 따라 말하기 →</a></section>;
}

export function HyperSoapSection() {
  return <section className="mb-5 overflow-hidden rounded-2xl bg-[#071a2d] text-white shadow-sm ring-1 ring-slate-900/10"><Image src="/hyper-soap-promo.png" alt="진료 대화가 네 영역의 구조화된 기록으로 정리되는 Hyper-SOAP 개념 이미지" width={1693} height={929} className="h-auto w-full" /><div className="p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-teal-300/15 px-2.5 py-1 text-[10px] font-semibold text-teal-200 ring-1 ring-inset ring-teal-200/20">HyperDoctor Clinical Workspace</span><span className="text-[10px] font-medium text-amber-200">DEMO</span></div><h2 className="mt-3 text-lg font-bold leading-snug">진료는 대화로. 기록은 Hyper-SOAP으로.</h2><p className="mt-2 text-xs leading-relaxed text-slate-300">진료 대화와 필요한 사진·문서를 한 번에 정리해 SOAP 초안과 놓치기 쉬운 확인 포인트를 짧게 보여주는 AI 차팅 워크스페이스입니다.</p><div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-200">{["대화 녹음", "사진·문서", "SOAP 초안", "확인 포인트"].map((item) => <span key={item} className="rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-inset ring-white/10">{item}</span>)}</div><a href={HYPER_SOAP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-300 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-teal-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071a2d]">Hyper-SOAP 데모 버전 살펴보기 →</a><p className="mt-2 text-[10px] leading-relaxed text-slate-400">AI 결과는 진료기록 초안입니다. 실제 차트 반영 전 의료진의 검토가 필요합니다.</p></div></section>;
}

export function NoticeSection({ notice }: { notice: Notice }) {
  if (!notice.enabled) return null;
  return <section className="mb-5 rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100"><p className="text-xs font-semibold text-blue-600">📢 {notice.title}</p><NoticeContent blocks={notice.blocks} />{notice.cta && <a href={notice.cta.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white">{notice.cta.label} →</a>}</section>;
}

export function AdvertisementSection() {
  return <section className="mb-5 flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-300">광고 영역 (Google AdSense)</section>;
}
