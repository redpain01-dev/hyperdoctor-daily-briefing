import { getMarketIndex, type IndexQuote } from "./marketIndex";

export type { IndexQuote };

export async function getNasdaq(): Promise<IndexQuote | null> {
  return getMarketIndex("^IXIC", "나스닥");
}
