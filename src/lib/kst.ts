// 빌드 서버(GitHub Actions 등)는 보통 UTC로 동작한다. "오늘"을 로컬 타임존 getter로
// 읽으면 자정~오전 9시(KST) 사이 빌드 시 하루 전 날짜로 계산되는 문제가 생기므로,
// 이 값을 항상 getUTC*() 접근자로만 읽어서 KST 기준 날짜를 구해야 한다.
export function kstNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}
