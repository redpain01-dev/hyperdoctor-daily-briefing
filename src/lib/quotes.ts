import quotes from "./data/quotes.json";

export interface Quote {
  text: string;
  author: string;
}

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getTodayQuote(today: Date = new Date()): Quote {
  const list = quotes as Quote[];
  const idx = dayOfYear(today) % list.length;
  return list[idx];
}
