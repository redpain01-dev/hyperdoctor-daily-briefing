"use client";

import { useEffect, useState } from "react";

const BRIEFING_URL = "https://hyperinvest.hyperdoctor.app/briefings/today?utm_source=daily-briefing&utm_medium=feature-card";
const labels = { us: "미국주식", kr: "국내주식", crypto: "크립토" } as const;
type Preview = { editionDate: string; readingMinutes: number; headlines: { market: keyof typeof labels; title: string }[] };

function parsePreview(value: unknown): Preview | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<Preview>;
  if (typeof data.editionDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.editionDate) || typeof data.readingMinutes !== "number" || !Number.isFinite(data.readingMinutes) || !Array.isArray(data.headlines)) return null;
  const headlines = data.headlines.filter((item) => item && Object.hasOwn(labels, item.market) && typeof item.title === "string").slice(0, 3);
  return { editionDate: data.editionDate, readingMinutes: Math.max(1, Math.min(30, data.readingMinutes)), headlines };
}

export function HyperInvestBriefingCard() {
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    fetch("https://hyperinvest.hyperdoctor.app/api/briefings/today", { signal: controller.signal, credentials: "omit" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: unknown) => { if (!controller.signal.aborted) setPreview(parsePreview(data)); })
      .catch(() => { /* The permanent latest-edition link remains usable when previews are unavailable. */ })
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  return <section aria-labelledby="hyperinvest-briefing-title" className="mb-5 overflow-hidden rounded-2xl bg-[#082636] p-5 text-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-bold tracking-widest text-teal-200">HYPERINVEST DAILY</span><span className="text-[11px] text-amber-200">{preview ? `${preview.editionDate} · 약 ${preview.readingMinutes}분` : "매일 새롭게 업데이트"}</span></div>
    <h2 id="hyperinvest-briefing-title" className="mt-3 text-lg font-bold leading-snug">오늘의 7분 시장 브리핑</h2>
    <p className="mt-2 text-xs leading-relaxed text-slate-200">미국주식·국내주식·크립토의 최신 뉴스와 핵심 배경, 연준·한국은행·금융위원회 공식 소식을 한 번에 읽어보세요.</p>
    {preview && preview.headlines.length > 0 && <ul className="mt-4 space-y-3 border-t border-white/15 pt-4">{preview.headlines.map((item) => <li key={item.market} className="text-xs leading-relaxed"><span className="mr-2 font-semibold text-teal-200">{labels[item.market]}</span><span>{item.title}</span></li>)}</ul>}
    <a href={BRIEFING_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-teal-300 px-4 py-3 text-sm font-bold text-[#082636] hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-200">오늘의 브리핑 전체 읽기 →</a>
  </section>;
}
