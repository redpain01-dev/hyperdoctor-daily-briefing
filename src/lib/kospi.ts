import { getMarketIndex, type IndexQuote } from "./marketIndex";

export type { IndexQuote };

export async function getKospi(): Promise<IndexQuote | null> {
  return getMarketIndex("^KS11", "코스피");
}
