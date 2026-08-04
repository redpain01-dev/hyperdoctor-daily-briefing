// 기상청 공공데이터포털(data.go.kr) 단기예보(getVilageFcst) + 중기예보(getMidLandFcst/getMidTa) 연동.
// 기상청 응답이 일시적으로 실패하면 Open-Meteo 예보로 빈 날짜를 보완한다.

export interface DailyWeather {
  date: string; // yyyy-MM-dd
  label: string; // 오늘/내일/모레/요일
  skyText: string;
  icon: string; // skyText를 매핑한 이모지
  tmin: number | null;
  tmax: number | null;
  pop: number | null; // 강수확률(%)
  source: "기상청" | "Open-Meteo";
}

type WeatherRow = Omit<DailyWeather, "label" | "icon">;

interface KmaItem {
  [key: string]: string | number | undefined;
  fcstDate?: string;
  fcstTime?: string;
  category?: string;
  fcstValue?: string;
}

interface KmaJsonResponse {
  response?: {
    header?: {
      resultCode?: string | number;
      resultMsg?: string;
    };
    body?: {
      items?: {
        item?: KmaItem[];
      };
    };
  };
}

// 기상청 API는 아이콘/이미지를 주지 않고 텍스트만 준다. 이 함수로 텍스트를 이모지로
// 매핑해서 직관적으로 보이게 한다 (외부 API와 무관하게 우리가 직접 그리는 부분).
function skyTextToIcon(text: string): string {
  if (text.includes("천둥")) return "⛈️";
  if (text.includes("안개")) return "🌫️";
  if (text.includes("눈")) return "❄️";
  if (text.includes("소나기")) return "🌦️";
  if (text.includes("비")) return "🌧️";
  if (text.includes("흐림") || text.includes("흐리고")) return "☁️";
  if (text.includes("구름많음")) return "⛅";
  if (text.includes("맑음")) return "☀️";
  return "🌡️";
}

const SEOUL_NX = 60;
const SEOUL_NY = 127;
const MID_LAND_REG_ID = "11B00000"; // 서울·인천·경기 육상예보
const MID_TA_REG_ID = "11B10101"; // 서울 기온
const REQUEST_TIMEOUT_MS = 12_000;

function normalizeServiceKey(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.includes("%")) return trimmed;

  try {
    // 공공데이터포털의 "인코딩 키"를 URLSearchParams에 그대로 넣으면 %가 한 번 더
    // 인코딩될 수 있다. 먼저 원문으로 복원해 URLSearchParams가 정확히 한 번만 인코딩하게 한다.
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function findXmlValue(text: string, tag: string): string | null {
  const match = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
  return match?.[1]?.trim() || null;
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function fetchKmaJson(url: URL, label: string): Promise<KmaJsonResponse> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        cache: "force-cache",
        signal: controller.signal,
      });
      const body = await response.text();

      if (!response.ok) {
        throw new Error(`${label} HTTP ${response.status}`);
      }

      let json: KmaJsonResponse;
      try {
        json = JSON.parse(body) as KmaJsonResponse;
      } catch {
        const code = findXmlValue(body, "returnReasonCode") ?? findXmlValue(body, "resultCode");
        const message = findXmlValue(body, "returnAuthMsg") ?? findXmlValue(body, "resultMsg");
        throw new Error(`${label} ${code ?? "NON_JSON"}${message ? `: ${message}` : ""}`);
      }

      const header = json?.response?.header;
      if (header?.resultCode && !["00", "0000"].includes(String(header.resultCode))) {
        throw new Error(`${label} ${header.resultCode}: ${header.resultMsg ?? "API error"}`);
      }

      return json;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(safeErrorMessage(lastError));
}

function toKstParts(date: Date) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    y: kst.getUTCFullYear(),
    m: kst.getUTCMonth() + 1,
    d: kst.getUTCDate(),
    hh: kst.getUTCHours(),
    mm: kst.getUTCMinutes(),
    date: kst,
  };
}

function fmtDate(y: number, m: number, d: number) {
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;
}

function addDays(y: number, m: number, d: number, delta: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function skyCodeToText(sky?: string, pty?: string) {
  if (pty && pty !== "0") {
    return { "1": "비", "2": "비/눈", "3": "눈", "4": "소나기" }[pty] ?? "비";
  }
  return { "1": "맑음", "3": "구름많음", "4": "흐림" }[sky ?? ""] ?? "-";
}

function getShortTermBase(now: Date) {
  const { y, m, d, hh, mm } = toKstParts(now);
  const times = [2, 5, 8, 11, 14, 17, 20, 23];
  let chosen = -1;
  for (const t of times) {
    if (hh > t || (hh === t && mm >= 10)) chosen = t;
  }
  if (chosen === -1) {
    const prev = addDays(y, m, d, -1);
    return { base_date: fmtDate(prev.y, prev.m, prev.d), base_time: "2300" };
  }
  return { base_date: fmtDate(y, m, d), base_time: `${String(chosen).padStart(2, "0")}00` };
}

async function fetchShortTerm(serviceKey: string, now: Date) {
  const { base_date, base_time } = getShortTermBase(now);
  const url = new URL(
    "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
  );
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", base_date);
  url.searchParams.set("base_time", base_time);
  url.searchParams.set("nx", String(SEOUL_NX));
  url.searchParams.set("ny", String(SEOUL_NY));

  const json = await fetchKmaJson(url, "KMA_SHORT");
  const items = json?.response?.body?.items?.item ?? [];

  const byDate: Record<
    string,
    {
      tmin?: number;
      tmax?: number;
      pop: number;
      sky?: string;
      pty?: string;
      skyDiff?: number;
      ptyDiff?: number;
    }
  > = {};

  // SKY/PTY는 정오(1200) 값을 우선하되, 그 시각 데이터가 없는 경계일(마지막 예보일 등)에는
  // 가장 정오에 가까운 시각의 값을 대신 사용한다.
  for (const it of items) {
    const date = it.fcstDate;
    const value = it.fcstValue;
    if (!date || value === undefined) continue;

    byDate[date] ??= { pop: 0 };
    const entry = byDate[date];
    if (it.category === "TMN") entry.tmin = parseFloat(value);
    if (it.category === "TMX") entry.tmax = parseFloat(value);
    if (it.category === "POP") entry.pop = Math.max(entry.pop, parseInt(value, 10) || 0);
    if (it.category === "SKY") {
      const diff = Math.abs(parseInt(it.fcstTime ?? "1200", 10) - 1200);
      if (entry.skyDiff === undefined || diff < entry.skyDiff) {
        entry.skyDiff = diff;
        entry.sky = value;
      }
    }
    if (it.category === "PTY") {
      const diff = Math.abs(parseInt(it.fcstTime ?? "1200", 10) - 1200);
      if (entry.ptyDiff === undefined || diff < entry.ptyDiff) {
        entry.ptyDiff = diff;
        entry.pty = value;
      }
    }
  }

  return Object.entries(byDate).map(([date, v]) => ({
    date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    tmin: v.tmin ?? null,
    tmax: v.tmax ?? null,
    pop: v.pop,
    skyText: skyCodeToText(v.sky, v.pty),
    source: "기상청" as const,
  }));
}

function getMidTermTmFc(now: Date) {
  const { y, m, d, hh, mm } = toKstParts(now);
  // 중기예보는 06:00, 18:00에 발표(약간의 지연 반영해 10분 버퍼)
  if (hh > 18 || (hh === 18 && mm >= 10)) {
    return { tmFc: `${fmtDate(y, m, d)}1800`, y, m, d };
  }
  if (hh > 6 || (hh === 6 && mm >= 10)) {
    return { tmFc: `${fmtDate(y, m, d)}0600`, y, m, d };
  }
  const prev = addDays(y, m, d, -1);
  return { tmFc: `${fmtDate(prev.y, prev.m, prev.d)}1800`, y: prev.y, m: prev.m, d: prev.d };
}

async function fetchMidTerm(serviceKey: string, now: Date) {
  const { tmFc, y: fcY, m: fcM, d: fcD } = getMidTermTmFc(now);

  const landUrl = new URL(
    "https://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst"
  );
  landUrl.searchParams.set("serviceKey", serviceKey);
  landUrl.searchParams.set("numOfRows", "10");
  landUrl.searchParams.set("pageNo", "1");
  landUrl.searchParams.set("dataType", "JSON");
  landUrl.searchParams.set("regId", MID_LAND_REG_ID);
  landUrl.searchParams.set("tmFc", tmFc);

  const taUrl = new URL("https://apis.data.go.kr/1360000/MidFcstInfoService/getMidTa");
  taUrl.searchParams.set("serviceKey", serviceKey);
  taUrl.searchParams.set("numOfRows", "10");
  taUrl.searchParams.set("pageNo", "1");
  taUrl.searchParams.set("dataType", "JSON");
  taUrl.searchParams.set("regId", MID_TA_REG_ID);
  taUrl.searchParams.set("tmFc", tmFc);

  const [landJson, taJson] = await Promise.all([
    fetchKmaJson(landUrl, "KMA_MID_LAND"),
    fetchKmaJson(taUrl, "KMA_MID_TA"),
  ]);
  const land = landJson?.response?.body?.items?.item?.[0] ?? {};
  const ta = taJson?.response?.body?.items?.item?.[0] ?? {};

  const out: {
    date: string;
    tmin: number | null;
    tmax: number | null;
    pop: number | null;
    skyText: string;
    source: "기상청";
  }[] = [];

  // wf{day}Am/wf{day}Pm(3~7일) 또는 wf{day}(8~10일) 필드는 tmFc(발표시각)로부터 며칠 뒤인지를
  // 나타내므로, 실제 달력 날짜는 "오늘"이 아니라 발표일(fcY/fcM/fcD) 기준으로 더해야 한다.
  // 발표 시각(06시/18시)에 따라 어느 day부터 필드가 채워지는지 달라지므로, 필드가 실제로
  // 존재하는 day만 사용한다.
  for (let day = 3; day <= 10; day++) {
    const wf = land[`wf${day}Am`] ?? land[`wf${day}`];
    if (wf === undefined) continue;

    const target = addDays(fcY, fcM, fcD, day);
    const dateStr = `${target.y}-${String(target.m).padStart(2, "0")}-${String(
      target.d
    ).padStart(2, "0")}`;
    const pop = land[`rnSt${day}Am`] ?? land[`rnSt${day}`] ?? null;
    const tmin = ta[`taMin${day}`] ?? null;
    const tmax = ta[`taMax${day}`] ?? null;
    out.push({
      date: dateStr,
      tmin: tmin !== null && tmin !== undefined ? Number(tmin) : null,
      tmax: tmax !== null && tmax !== undefined ? Number(tmax) : null,
      pop: pop !== null ? Number(pop) : null,
      skyText: String(wf),
      source: "기상청",
    });
  }
  return out;
}

function wmoCodeToText(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1) return "대체로 맑음";
  if (code === 2) return "구름많음";
  if (code === 3) return "흐림";
  if ([45, 48].includes(code)) return "안개";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return "비";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "눈";
  if ([80, 81, 82].includes(code)) return "소나기";
  if ([95, 96, 99].includes(code)) return "천둥번개";
  return "날씨";
}

async function fetchFallbackWeather(): Promise<WeatherRow[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", "37.5665");
  url.searchParams.set("longitude", "126.9780");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
  );
  url.searchParams.set("timezone", "Asia/Seoul");
  url.searchParams.set("forecast_days", "7");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      cache: "force-cache",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`OPEN_METEO HTTP ${response.status}`);

    const json = await response.json();
    const daily = json?.daily;
    if (!Array.isArray(daily?.time)) throw new Error("OPEN_METEO_INVALID_RESPONSE");

    return daily.time.map((date: string, index: number) => ({
      date,
      skyText: wmoCodeToText(Number(daily.weather_code?.[index] ?? -1)),
      tmin: Number.isFinite(Number(daily.temperature_2m_min?.[index]))
        ? Number(daily.temperature_2m_min[index])
        : null,
      tmax: Number.isFinite(Number(daily.temperature_2m_max?.[index]))
        ? Number(daily.temperature_2m_max[index])
        : null,
      pop: Number.isFinite(Number(daily.precipitation_probability_max?.[index]))
        ? Number(daily.precipitation_probability_max[index])
        : null,
      source: "Open-Meteo" as const,
    }));
  } finally {
    clearTimeout(timeout);
  }
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export async function getWeeklyWeather(): Promise<DailyWeather[] | null> {
  const now = new Date();
  const serviceKey = process.env.KMA_SERVICE_KEY
    ? normalizeServiceKey(process.env.KMA_SERVICE_KEY)
    : null;
  const merged = new Map<string, WeatherRow>();

  if (serviceKey) {
    const [shortResult, midResult] = await Promise.allSettled([
      fetchShortTerm(serviceKey, now),
      fetchMidTerm(serviceKey, now),
    ]);

    const midTerm = midResult.status === "fulfilled" ? midResult.value : [];
    const shortTerm = shortResult.status === "fulfilled" ? shortResult.value : [];

    if (shortResult.status === "rejected") {
      console.warn(`[weather] ${safeErrorMessage(shortResult.reason)}`);
    }
    if (midResult.status === "rejected") {
      console.warn(`[weather] ${safeErrorMessage(midResult.reason)}`);
    }

    // 단기예보의 마지막 경계일은 TMX/TMN(최고/최저기온)이 비어있는 경우가 있어, 그 날은
    // 중기예보 쪽이 더 완전하다. 그래서 중기예보를 기본으로 깔고, 단기예보는 기온 데이터가
    // 실제로 채워져 있을 때만 덮어쓴다.
    for (const d of midTerm) merged.set(d.date, d);
    for (const d of shortTerm) {
      const existing = merged.get(d.date);
      if (!existing || d.tmax !== null) merged.set(d.date, d);
    }
  } else {
    console.warn("[weather] KMA_SERVICE_KEY is missing; using fallback forecast");
  }

  // 기상청 한쪽 서비스만 실패했거나 키가 없더라도 주간 날씨 전체가 사라지지 않게 보완한다.
  if (merged.size < 7) {
    try {
      const fallback = await fetchFallbackWeather();
      for (const d of fallback) {
        if (!merged.has(d.date)) merged.set(d.date, d);
      }
    } catch (error) {
      console.warn(`[weather] ${safeErrorMessage(error)}`);
    }
  }

  const { y, m, d } = toKstParts(now);
  const today = `${fmtDate(y, m, d).slice(0, 4)}-${fmtDate(y, m, d).slice(4, 6)}-${fmtDate(
    y,
    m,
    d
  ).slice(6, 8)}`;
  const sorted = Array.from(merged.values())
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  if (sorted.length === 0) return null;

  return sorted.map((item, index) => {
    // +09:00 오프셋으로 절대시각을 고정한 뒤 getUTCDay()로 읽어야 빌드 서버의
    // 로컬 타임존(보통 UTC)과 무관하게 항상 KST 기준 요일이 나온다.
    const dow = WEEKDAY[new Date(`${item.date}T00:00:00+09:00`).getUTCDay()];
    const label = index === 0 ? "오늘" : index === 1 ? "내일" : `${dow}`;
    return { ...item, label, icon: skyTextToIcon(item.skyText) };
  });
}
