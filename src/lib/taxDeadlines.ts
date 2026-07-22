import { kstNow } from "./kst";

export interface TaxDeadline {
  name: string;
  date: string; // yyyy-MM-dd
  dday: number;
  description: string;
}

interface RecurringDeadline {
  name: string;
  monthly: boolean;
  month: number; // 1-indexed (1=1월). monthly=true면 무시됨
  day: number;
  description: string;
}

// 개인사업자(의원) 기준 대표 일정. 법인/성실신고확인대상자 등은 일정이 달라질 수 있으므로
// 반드시 관할 세무서·담당 세무사와 정확한 일정을 다시 확인해야 한다.
const RECURRING_DEADLINES: RecurringDeadline[] = [
  { name: "원천세 신고·납부", monthly: true, month: 0, day: 10, description: "매월 10일, 전월 귀속 원천징수분 신고·납부" },
  { name: "사업장현황신고", monthly: false, month: 2, day: 10, description: "면세사업자(의료업 등)의 전년도 수입금액 신고" },
  { name: "4대보험 보수총액 신고", monthly: false, month: 3, day: 10, description: "전년도 보수총액을 국민연금·건강보험공단에 신고" },
  { name: "종합소득세 신고·납부", monthly: false, month: 5, day: 31, description: "전년도 종합소득세 신고·납부 (성실신고확인대상자는 6/30까지)" },
  { name: "부가가치세 1기 확정신고·납부", monthly: false, month: 7, day: 25, description: "1~6월분 부가세 확정신고·납부 (개인 일반과세자)" },
  { name: "부가가치세 2기 확정신고·납부", monthly: false, month: 1, day: 25, description: "7~12월분 부가세 확정신고·납부 (개인 일반과세자)" },
];

// today는 kstNow()로 만든 값이라는 전제 하에, 전부 getUTC*()/Date.UTC()로만 다뤄야
// 빌드 서버의 로컬 타임존(보통 UTC)과 무관하게 KST 기준 날짜로 계산된다.
function stripTime(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function nextOccurrence(today: Date, rd: RecurringDeadline): number {
  const todayMidnight = stripTime(today);
  if (rd.monthly) {
    let candidate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), rd.day);
    if (candidate < todayMidnight) {
      candidate = Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, rd.day);
    }
    return candidate;
  }
  const monthIndex = rd.month - 1; // 0-indexed
  const thisYear = Date.UTC(today.getUTCFullYear(), monthIndex, rd.day);
  if (thisYear >= todayMidnight) return thisYear;
  return Date.UTC(today.getUTCFullYear() + 1, monthIndex, rd.day);
}

function fmt(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

export function getUpcomingDeadlines(today: Date = kstNow(), limit = 5): TaxDeadline[] {
  const todayMidnight = stripTime(today);

  const list = RECURRING_DEADLINES.map((rd) => {
    const dateMs = nextOccurrence(today, rd);
    const dday = Math.round((dateMs - todayMidnight) / (1000 * 60 * 60 * 24));
    return { name: rd.name, date: fmt(dateMs), dday, description: rd.description };
  });

  return list.sort((a, b) => a.dday - b.dday).slice(0, limit);
}
