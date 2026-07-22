// 기상청 공공데이터포털(data.go.kr) 단기예보(getVilageFcst) + 중기예보(getMidLandFcst/getMidTa) 연동.
// KMA_SERVICE_KEY 환경변수가 없으면 null을 반환하고, UI에서는 설정 안내 배너를 보여준다.

export interface DailyWeather {
  date: string; // yyyy-MM-dd
  label: string; // 오늘/내일/모레/요일
  skyText: string;
  tmin: number | null;
  tmax: number | null;
  pop: number | null; // 강수확률(%)
}

const SEOUL_NX = 60;
const SEOUL_NY = 127;
const MID_LAND_REG_ID = "11B00000"; // 서울·인천·경기 육상예보
const MID_TA_REG_ID = "11B10101"; // 서울 기온

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

  const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const json = await res.json();
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
    const date = it.fcstDate as string;
    byDate[date] ??= { pop: 0 };
    const entry = byDate[date];
    if (it.category === "TMN") entry.tmin = parseFloat(it.fcstValue);
    if (it.category === "TMX") entry.tmax = parseFloat(it.fcstValue);
    if (it.category === "POP") entry.pop = Math.max(entry.pop, parseInt(it.fcstValue, 10) || 0);
    if (it.category === "SKY") {
      const diff = Math.abs(parseInt(it.fcstTime, 10) - 1200);
      if (entry.skyDiff === undefined || diff < entry.skyDiff) {
        entry.skyDiff = diff;
        entry.sky = it.fcstValue;
      }
    }
    if (it.category === "PTY") {
      const diff = Math.abs(parseInt(it.fcstTime, 10) - 1200);
      if (entry.ptyDiff === undefined || diff < entry.ptyDiff) {
        entry.ptyDiff = diff;
        entry.pty = it.fcstValue;
      }
    }
  }

  return Object.entries(byDate).map(([date, v]) => ({
    date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
    tmin: v.tmin ?? null,
    tmax: v.tmax ?? null,
    pop: v.pop,
    skyText: skyCodeToText(v.sky, v.pty),
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

  const [landRes, taRes] = await Promise.all([
    fetch(landUrl.toString(), { next: { revalidate: 3600 * 6 } }),
    fetch(taUrl.toString(), { next: { revalidate: 3600 * 6 } }),
  ]);
  if (!landRes.ok || !taRes.ok) return [];

  const landJson = await landRes.json();
  const taJson = await taRes.json();
  const land = landJson?.response?.body?.items?.item?.[0] ?? {};
  const ta = taJson?.response?.body?.items?.item?.[0] ?? {};

  const out: {
    date: string;
    tmin: number | null;
    tmax: number | null;
    pop: number | null;
    skyText: string;
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
      skyText: wf,
    });
  }
  return out;
}

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

export async function getWeeklyWeather(): Promise<DailyWeather[] | null> {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) return null;

  try {
    const now = new Date();
    const [shortTerm, midTerm] = await Promise.all([
      fetchShortTerm(serviceKey, now),
      fetchMidTerm(serviceKey, now),
    ]);

    // 단기예보의 마지막 경계일은 TMX/TMN(최고/최저기온)이 비어있는 경우가 있어, 그 날은
    // 중기예보 쪽이 더 완전하다. 그래서 중기예보를 기본으로 깔고, 단기예보는 기온 데이터가
    // 실제로 채워져 있을 때만 덮어쓴다.
    const merged = new Map<string, Omit<DailyWeather, "label">>();
    for (const d of midTerm) merged.set(d.date, d);
    for (const d of shortTerm) {
      const existing = merged.get(d.date);
      if (!existing || d.tmax !== null) merged.set(d.date, d);
    }

    const sorted = Array.from(merged.values()).sort((a, b) => a.date.localeCompare(b.date));

    return sorted.slice(0, 7).map((d, i) => {
      const dow = WEEKDAY[new Date(`${d.date}T00:00:00+09:00`).getDay()];
      const label = i === 0 ? "오늘" : i === 1 ? "내일" : `${dow}`;
      return { ...d, label };
    });
  } catch {
    return null;
  }
}
