import quotes from "./data/quotes.json";
import movieQuotes from "./data/movieQuotes.json";
import { kstNow } from "./kst";

interface QuoteData {
  text: string;
  author?: string;
  source?: string;
}

export interface Quote {
  text: string;
  source: string;
}

export interface MovieQuote {
  text: string;
  movie: string;
  year: number;
  country: string;
  resonance: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function greatestCommonDivisor(a: number, b: number) {
  let left = a;
  let right = b;
  while (right !== 0) {
    [left, right] = [right, left % right];
  }
  return left;
}

// 풀 크기와 서로소인 보폭을 사용하면 모든 항목을 한 번씩 보여주기 전에는 반복되지 않는다.
function getFullCycleIndex(today: Date, length: number, salt: number) {
  if (length === 0) throw new Error("문구 풀이 비어 있습니다.");

  const dateOnly = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const absoluteDay = Math.floor(dateOnly / DAY_IN_MS);
  let stride = Math.max(2, Math.floor(length * 0.618));
  while (greatestCommonDivisor(stride, length) !== 1) stride += 1;

  return ((absoluteDay * stride + salt) % length + length) % length;
}

export function getTodayQuote(today: Date = kstNow()): Quote {
  const list = quotes as QuoteData[];
  const item = list[getFullCycleIndex(today, list.length, 17)];
  return {
    text: item.text,
    // 기존 자체 편집 문장은 author를 유지하고, 출처가 있는 신규 문장은 source를 우선한다.
    source: item.source ?? item.author ?? "데일리 브리핑",
  };
}

export function getTodayMovieQuote(today: Date = kstNow()): MovieQuote {
  const list = movieQuotes as MovieQuote[];
  const idx = getFullCycleIndex(today, list.length, 43);
  return list[idx];
}
