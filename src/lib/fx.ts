export interface FxRate {
  base: string;
  quote: string;
  rate: number;
  updatedAt: string;
}

export async function getUsdKrw(): Promise<FxRate | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.KRW;
    if (typeof rate !== "number") return null;
    return {
      base: "USD",
      quote: "KRW",
      rate,
      updatedAt: data.time_last_update_utc ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
