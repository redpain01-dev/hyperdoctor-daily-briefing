# 프로젝트 상태

## 2026-08-27 운영 장애 Hotfix

- 원인: Next.js 16.3.3 업데이트 뒤 `package-lock.json`에서 `@emnapi/core@1.11.3`과 `@emnapi/runtime@1.11.3`이 누락되어 예약 배포의 `npm ci`가 실패함.
- 수정: GitHub Actions와 동일한 npm 10.8.2로 lockfile을 재생성함.
- 검증: npm 10.8.2 `npm ci`, 취약점 감사(0건), production static export를 통과함.
- 산출물 확인: 2026년 8월 27일 KST 날짜, 최신 시장·의료뉴스·PubMed 데이터 렌더링을 확인함.

## Completed

- 기준 상태 커밋 `f5d246c`
- 101개 인생 문장과 53개 영화 명대사 풀
- 오늘의 한마디 + 오늘의 명대사 UI
- 카카오톡 등 소셜 공유용 Open Graph 이미지
- Hyper-SOAP 소개 이미지, 기능 요약, 공개 랜딩 CTA, 의료진 검토 고지

## Verification

- 데이터 파싱 및 중복: 통과 (인생 문장 101개, 영화 대사 53개, 중복 0)
- ESLint/TypeScript/production build: 통과
- 생성 HTML: 절대 OG/Twitter 이미지, 영화 명대사, SOAP 이미지·링크·검토 고지 확인
- 모바일 375px: 가로 넘침 없음, SOAP 카드 너비 342.7px, CTA와 이미지 정상
- 데스크톱 1280px: 본문 448px 중앙 정렬, 브라우저 오류 없음
- 운영 배포: 2026-08-21 완료 (`main` / GitHub Pages run `32442737627`)
- 운영 검증: 페이지·공유 이미지·SOAP 이미지 `200`, 영화 명대사·SOAP CTA·검토 고지·절대 OG URL 확인

## Deferred

- 일자별 동적 OG 이미지
- 명대사 저장·공유 기능
- Hyper-SOAP 전용 `/demo` 경로 연결

## Limitations

- 해외 작품의 한국어 대사는 의미 중심 번역으로 배급판 자막과 다를 수 있다.
- Hyper-SOAP는 현재 별도 데모 URL이 없어 공개 랜딩으로 연결한다.
