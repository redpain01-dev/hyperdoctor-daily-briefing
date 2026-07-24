# 개원의 정석 데일리 브리핑

『개원의 정석』 카카오톡 단톡방(개원의 정석 ver2.0)에 매일 아침 공유할 데일리 브리핑 웹페이지.

## 로컬에서 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

## 콘텐츠 구성

| 섹션 | 데이터 소스 | 비고 |
|---|---|---|
| 오늘의 한마디 | `src/lib/data/quotes.json` | 날짜 기반 로테이션. 문구는 이 파일에서 직접 추가/수정 가능 |
| 이번 주 날씨 | 기상청 공공데이터포털 API | **`KMA_SERVICE_KEY` 환경변수 필요** (아래 참고) |
| 원/달러 환율 | open.er-api.com (무료, 키 불필요) | 1시간마다 갱신 |
| 코스피 / 나스닥 | Yahoo Finance 비공식 엔드포인트 | 공식 API 아님 — 추후 불안정해지면 대체 필요. 완전 자동, 키 불필요 |
| 비트코인(USD) | CoinGecko 무료 API | 15분마다 갱신, 키 불필요 |
| 세무·행정 마감일 | `src/lib/taxDeadlines.ts` | 개인사업자(의원) 기준 대표 일정. 법인/성실신고 대상자는 로직 조정 필요 |
| 의료계 소식 | 청년의사·메디칼업저버·의학신문·메디컬투데이·메디파나뉴스·헬스코리아뉴스·라포르시안 RSS (7개) | 다른 매체 추가는 `src/lib/medNews.ts`의 `FEEDS` 배열 수정 |
| 최신 해외 의학저널 | PubMed E-utilities (무료, 키 불필요) | NEJM·JAMA·Lancet·Ann Intern Med·BMJ 최근 30일 RCT/메타분석/체계적 문헌고찰 등. **의도적으로 LLM 요약 없음** — 광고 외 수익원이 없어 LLM API 비용을 감당할 방법이 없고, 개원의 독자는 원문 제목만으로도 판단 가능하다는 것이 운영자 결정. 제목·저널·링크만 제공 |
| 방장 공지 | `src/lib/data/notice.txt` | 아래 "공지 수정 방법" 참고 |

## 공지 수정 방법

`src/lib/data/notice.txt` 파일을 열어 `:` 뒤의 내용만 바꾸고 저장하면 됩니다. JSON이 아닌
평문이라 따옴표·쉼표·중괄호를 신경 쓸 필요가 없습니다.

```
켜짐: 예
제목: 방장 공지
내용: 이번 주 토요일 저녁 7시, 개원의 정석 와인 모임이 있습니다...
링크: https://forms.gle/abcd1234
링크설명: 참석 신청하기
```

- `켜짐`을 `아니오`로 바꾸면 공지 배너 자체가 사라집니다
- `링크`를 비워두면 버튼 없이 문구만 표시되고, URL을 넣으면 그 아래 파란색 버튼(`링크설명` 문구)이 생깁니다
- 각 줄 맨 앞 `켜짐:` `제목:` `내용:` `링크:` `링크설명:` 라벨은 그대로 두고, 그 뒤 내용만 수정하세요

**터미널 없이도 수정 가능**: GitHub 저장소의 `src/lib/data/notice.txt` 파일을 웹 브라우저에서
열어 연필(✏️) 아이콘으로 바로 수정 → 우측 상단 "Commit changes"만 누르면 됩니다. push가 감지되면
아래 GitHub Actions가 자동으로 사이트를 다시 빌드해 반영합니다 (몇 분 소요).

## 날씨 API 키 발급 (필수)

1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. "기상청_단기예보 조회서비스", "기상청_중기예보 조회서비스" 각각 활용신청 (즉시 승인)
3. 발급된 서비스키(인코딩 키)를 `.env.local` 파일에 등록:
   ```
   KMA_SERVICE_KEY=발급받은키
   ```
   (`.env.local.example` 파일 참고)

키가 없으면 날씨 섹션에 설정 안내 배너가 표시되고 나머지 콘텐츠는 정상 노출됩니다.

`.env.local`은 로컬 개발용입니다. 실제 배포(GitHub Pages)에는 아래 "배포" 섹션의 GitHub
Actions Secrets에 **별도로 한 번 더** 등록해야 합니다.

## 배포 (GitHub Pages)

이 프로젝트는 Next.js를 **정적 사이트로 export**해서 GitHub Pages에 올리는 방식으로 배포합니다.
서버가 없는 방식이라 콘텐츠는 "요청 시 자동 갱신"이 아니라, `.github/workflows/deploy.yml`이
**매일 새벽(KST 05:30) 자동으로 사이트를 다시 빌드·배포**하면서 그 시점 데이터로 새로 구워집니다.
main 브랜치에 push가 될 때도 즉시 재배포됩니다.

### 최초 설정 (한 번만)

1. GitHub에서 새 저장소 생성 (Settings 아님, github.com 우측 상단 "New repository". README로 초기화하지 않기)
2. 로컬에서 원격 연결 후 push:
   ```bash
   cd ~/Desktop/hyperdoctor-dailycardnews
   git remote add origin https://github.com/<사용자명>/<저장소명>.git
   git branch -M main
   git push -u origin main
   ```
3. 저장소 **Settings → Secrets and variables → Actions → New repository secret**에서
   `KMA_SERVICE_KEY` 이름으로 발급받은 기상청 키 등록 (빌드 시점에 필요)
4. 저장소 **Settings → Pages → Build and deployment → Source**를 **"GitHub Actions"**로 설정
5. 저장소 **Actions** 탭 → "Deploy to GitHub Pages" 워크플로 → **Run workflow**로 최초 1회 수동 실행
6. 완료되면 `https://<사용자명>.github.io/<저장소명>/` 에서 확인 가능

이후로는 push하거나 매일 새벽 자동으로 재배포되므로 별도 조작이 필요 없습니다.

### 매일 공유 방법

매일 아침 운영진이 배포된 링크를 카카오톡 단톡방에 직접 공유합니다. 카카오톡에는 공식 봇 API가
없어 자동 게시는 지원하지 않습니다.

## 애드센스

푸터 위 "광고 영역" 자리(`src/app/page.tsx`)에 애드센스 스크립트/유닛을 삽입하세요. 신청 전 콘텐츠를 며칠~몇 주 축적해두는 것을 권장하며, 클릭을 유도하는 문구는 정책 위반이므로 넣지 않습니다.
