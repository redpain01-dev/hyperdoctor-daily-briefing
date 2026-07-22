export interface CoinQuote {
  name: string;
  priceUsd: number;
  changePercent24h: number;
}

export async function getBitcoin(): Promise<CoinQuote | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const usd = data?.bitcoin?.usd;
    const change = data?.bitcoin?.usd_24h_change;
    if (typeof usd !== "number") return null;
    return {
      name: "비트코인",
      priceUsd: usd,
      changePercent24h: typeof change === "number" ? change : 0,
    };
  } catch {
    return null;
  }
}
