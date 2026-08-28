import quotes from "./data/quotes.json";
import movieQuotes from "./data/movieQuotes.json";
import { kstNow } from "./kst";

export interface Quote {
  text: string;
  author: string;
}

export interface MovieQuote {
  text: string;
  movie: string;
  year: number;
  country: string;
  resonance: string;
}

// today는 kstNow()로 만든 값이라는 전제 하에, getUTC*()로만 읽어야 KST 기준 날짜가 나온다.
function dayOfYear(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const diff = d.getTime() - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getTodayQuote(today: Date = kstNow()): Quote {
  const list = quotes as Quote[];
  const idx = dayOfYear(today) % list.length;
  return list[idx];
}

export function getTodayMovieQuote(today: Date = kstNow()): MovieQuote {
  const list = movieQuotes as MovieQuote[];
  // 일반 문장과 영화 대사의 순환 패턴이 겹치지 않도록 다른 보폭으로 순환한다.
  const idx = (dayOfYear(today) * 7 + today.getUTCFullYear()) % list.length;
  return list[idx];
}
