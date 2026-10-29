# 익명 투표 운영

브리핑 하단의 익명 투표는 관리자 앱 `/polls`에서 관리한다. 브리핑은 정적 배포를 유지하고 `https://briefing-admin.hyperdoctor.app/api/public/poll`에서 현재 투표와 합계를 가져온다. 따라서 투표 내용/기간을 저장하면 브리핑 전체 재배포 없이 반영된다.

## 화면과 조건

- 광고 위치 직전에 배치하는 흰색·teal 카드, 선택지는 큰 터치 영역과 키보드 포커스를 제공한다.
- 단일 선택은 선택 즉시 전송, 복수 선택은 선택 후 투표 버튼으로 확정한다.
- 응답 저장 성공 즉시 결과를 표시한다. 다른 응답은 화면이 보이는 동안 10초마다 확인한다.
- 원형 그래프와 항목별 득표/비율을 함께 보여 준다. 복수 선택 그래프의 비율은 전체 선택 수를 분모로 한다.
- 빈 집계, 로딩, 예정, 마감, 참여 완료, 네트워크 오류를 구분한다. 오류를 0표로 표시하지 않는다.
- 익명 참여 및 브라우저에 임의 식별값 저장 안내를 항상 표시한다. 개인정보를 입력받지 않는다.

## 운영 경계

- 설정 저장 API는 기존 관리자 세션과 요청 Origin 검증을 요구한다.
- 공개 API는 허용한 브리핑 Origin만 CORS로 허용하고, 비밀키는 서버에서만 사용한다.
- 데이터 저장소는 투표별 해시 식별값과 선택지만 보관하고 외부에는 집계만 돌려준다.
- 브라우저 저장소를 지우거나 다른 기기를 쓰면 추가 참여가 가능하다. 로그인 없는 의견 조사이며 신원 기반 선거 기능이 아니다.
- 첫 응답 이후 질문/선택지/선택 방식은 잠긴다. 문항을 바꾸려면 새 투표를 만든다.
- 숨긴 투표는 브리핑에서 사라지고, 마감 투표는 결과만 표시한다. 새 공개 투표를 만들면 기존 투표는 관리자 목록에 보관된다.

## 연결 설정

관리자 서버 전용 `POLL_SUPABASE_URL`, `POLL_SUPABASE_PUBLISHABLE_KEY`, `POLL_SERVICE_TOKEN`으로 저장소를 연결한다. 서비스 토큰 원문은 환경변수에서만 보관하고 데이터베이스에는 해시만 저장한다. 공개 브리핑에는 이 환경변수를 전달하지 않는다.

SQL 구현과 트랜잭션 검증은 `db/briefing-polls.sql`, `db/verify-briefing-polls.sql`에 둔다. 2026-10-29 사용자 승인으로 한국 리전 `hyperread-db`의 `briefing_private` 스키마에 연결했고 `add_briefing_anonymous_polls` 마이그레이션을 적용했다. 환경변수는 관리자 production에만 저장한다.

관리 주소는 `https://briefing-admin.hyperdoctor.app/polls`이며 기존 Google 관리자 로그인을 사용한다. 첫 AI 구독 투표는 2026-11-05 23:59 KST에 마감한다. 새 투표는 생성 시점부터 7일 뒤 23:59 KST를 기본값으로 제안한다.

보안 점검의 [RLS enabled no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) 안내는 비공개 테이블의 직접 읽기·쓰기를 전부 차단하려는 설계와 일치한다. 공개 RPC의 [anon security definer](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) 경고도 서버 전용 비밀 토큰으로 모든 동작을 검증하는 의도된 진입점이다. 클라이언트에 비밀 토큰을 전달하거나 테이블 권한을 추가하지 않는다. 운영 검증에서 잘못된 토큰과 원본 투표 테이블 접근이 거부되는 것을 확인했다.
