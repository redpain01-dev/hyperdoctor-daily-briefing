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

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function nextOccurrence(today: Date, rd: RecurringDeadline): Date {
  const todayMidnight = stripTime(today);
  if (rd.monthly) {
    const candidate = new Date(today.getFullYear(), today.getMonth(), rd.day);
    if (candidate < todayMidnight) candidate.setMonth(candidate.getMonth() + 1);
    return candidate;
  }
  const monthIndex = rd.month - 1; // 0-indexed
  const thisYear = new Date(today.getFullYear(), monthIndex, rd.day);
  if (thisYear >= todayMidnight) return thisYear;
  return new Date(today.getFullYear() + 1, monthIndex, rd.day);
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function getUpcomingDeadlines(today: Date = new Date(), limit = 5): TaxDeadline[] {
  const todayMidnight = stripTime(today);

  const list = RECURRING_DEADLINES.map((rd) => {
    const date = nextOccurrence(today, rd);
    const dday = Math.round(
      (stripTime(date).getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { name: rd.name, date: fmt(date), dday, description: rd.description };
  });

  return list.sort((a, b) => a.dday - b.dday).slice(0, limit);
}
