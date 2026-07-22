import quotes from "./data/quotes.json";
import { kstNow } from "./kst";

export interface Quote {
  text: string;
  author: string;
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
