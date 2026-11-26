# 데일리 브리핑 갱신 운영

## 현재 구조

- 공개 사이트는 GitHub Pages의 Next.js 정적 빌드다. 날짜, 명언, 달력, 시세, 날씨, 뉴스와 논문은 빌드 시점에 생성된다.
- `.github/workflows/deploy.yml`의 예약 실행은 한국시간 00:07~05:37 사이 12회, `.github/workflows/daily-fallback.yml`은 00:47·02:47·04:47에 시도한다. GitHub 예약 실행은 지연되거나 생성되지 않을 수 있다.
- Vercel `briefing-admin`의 `/api/internal/daily-briefing-watchdog`는 한국시간 오전 1시대에 공개 날짜를 확인한다. 전날판이면 GitHub `repository_dispatch`의 `ensure-current-edition` 이벤트를 요청한다.
- 감시 API는 production의 `CRON_SECRET`으로 인증하고, GitHub 호출에는 production의 `GITHUB_TOKEN`을 사용한다. GitHub 토큰이 만료되면 Vercel Cron이 실행되더라도 배포 요청은 HTTP 401로 실패한다.

## 당일판이 갱신되지 않았을 때

1. `https://briefing.hyperdoctor.app/`의 머리말 날짜를 한국시간 날짜와 비교한다. 캐시 확인 시 `?edition-check=<현재 시각>`을 붙인다.
2. GitHub 저장소의 Actions에서 `Deploy to GitHub Pages`와 `Daily briefing fallback`의 오늘 실행을 확인한다. 실패한 실행이 있으면 로그를 확인한다. 실행 자체가 없다면 예약 이벤트 누락이다.
3. Vercel `briefing-admin`의 Runtime Logs에서 `[daily-briefing-watchdog] GitHub dispatch HTTP 401`을 확인한다. 이 경우 GitHub 토큰 만료 또는 취소 여부를 점검한다.
4. 유효한 GitHub 인증이 있으면 GitHub Actions의 `Deploy to GitHub Pages`에서 `Run workflow`를 실행하거나 `ensure-current-edition` 저장소 이벤트를 요청한다. 실행 완료 후 Actions의 `Verify current KST edition`과 공개 사이트 날짜를 확인한다.

## 자동 복구 토큰 교체

1. GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens에서 새 토큰을 만든다. Resource owner는 `redpain01-dev`, Repository access는 `Only select repositories` → `hyperdoctor-daily-briefing`으로 제한한다.
2. Repository permissions의 `Contents`를 `Read and write`로 지정한다. `repository_dispatch`에 필요한 권한은 이것이다. 만료일을 기록하고 만료 전에 갱신한다. 토큰을 저장소나 채팅에 붙여 넣지 않는다.
3. Vercel의 `briefing-admin` 프로젝트 → Settings → Environment Variables에서 production `GITHUB_TOKEN`의 값을 교체한다. 값은 Sensitive로 유지한다.
4. Vercel의 `briefing-admin` 최신 production 배포를 **Redeploy**한다. 환경 변수 변경은 기존 배포에 적용되지 않는다.
5. `CRON_SECRET` Bearer 인증으로 `/api/internal/daily-briefing-watchdog?check=github`를 호출하면 사이트를 재빌드하지 않고 `repository_dispatch` 권한을 검사한다. HTTP 200과 `github_credential_valid`를 확인한다. 만료 또는 권한 부족이면 HTTP 502와 `github_credential_rejected`를 반환한다. 평소의 감시 경로는 공개 페이지가 오늘판이면 `current`를 반환하고 GitHub 호출은 하지 않는다.

기존 GitHub 토큰은 2026-11-24에 만료됐다. 2026-11-26에 production 값을 교체하고 새 배포에 적용했으며, 배포 시 일회성 인증 검사에서 GitHub `repository_dispatch` HTTP 204를 확인했다.
