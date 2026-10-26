import Image from "next/image";
import { StoreInstallLink, StoreRegistrationBadge } from "@/components/store-install-link";

const HYPERLIVE_URL =
  "https://hyperlive.hyperdoctor.app/?utm_source=daily-briefing&utm_medium=feature-card&utm_campaign=hyperlive-medical-interpreter";
const HYPERLIVE_MICROSOFT_STORE_URL =
  "https://apps.microsoft.com/detail/9NJ99V7NXF42?hl=ko-KR&gl=KR";
const HYPERLIVE_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=app.hyperdoctor.hyperlive&hl=ko&gl=KR";

export function HyperLivePromoCard() {
  return (
    <section
      aria-labelledby="hyperlive-promo-title"
      className="mb-5 overflow-hidden rounded-2xl bg-[#082b30] text-white shadow-sm ring-1 ring-slate-900/10"
    >
      <div className="border-b border-white/10 bg-[#0b1826] px-5 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/hyperlive-icon-192.png"
            alt="하이퍼라이브 로고"
            width={64}
            height={64}
            className="shrink-0 rounded-2xl"
          />
          <div>
            <p className="text-lg font-bold tracking-wide text-white">HyperLive</p>
            <p className="mt-1 text-xs text-teal-200">두 언어로 이어지는 대화</p>
          </div>
        </div>
        <div aria-hidden="true" className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded-xl rounded-bl-sm bg-white/8 px-3 py-3 ring-1 ring-inset ring-white/10">
            <p className="text-[10px] font-semibold tracking-wider text-sky-200">ENGLISH</p>
            <p lang="en" className="mt-1 text-sm font-medium text-white">Hello.</p>
          </div>
          <span className="text-lg text-teal-300">⇄</span>
          <div className="rounded-xl rounded-br-sm bg-teal-300/10 px-3 py-3 ring-1 ring-inset ring-teal-200/20">
            <p className="text-[10px] font-semibold tracking-wider text-teal-200">한국어</p>
            <p className="mt-1 text-sm font-medium text-white">안녕하세요.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StoreRegistrationBadge store="microsoft" />
          <StoreRegistrationBadge store="google-play" />
        </div>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-semibold tracking-wider text-teal-200">
          HYPERDOCTOR · WINDOWS &amp; ANDROID
        </p>
        <h2 id="hyperlive-promo-title" className="mt-3 text-lg font-bold leading-snug">
          진료 통역을 PC와 Android 앱에서 더 빠르게.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-200">
          하이퍼라이브가 Microsoft Store와 Google Play에 등록됐습니다.
          진료실 PC와 Android 기기에 설치해 원문과 한국어를 나란히 확인하세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium text-teal-50">
          {["실시간 통역", "원문·한국어 함께 보기", "환자 QR 연결"].map((feature) => (
            <span key={feature} className="rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-inset ring-white/10">
              {feature}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <StoreInstallLink store="microsoft" href={HYPERLIVE_MICROSOFT_STORE_URL} product="HyperLive" />
          <StoreInstallLink store="google-play" href={HYPERLIVE_GOOGLE_PLAY_URL} product="하이퍼라이브" />
        </div>
        <a href={HYPERLIVE_URL} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-300/10 px-4 py-3 text-xs font-bold text-teal-100 ring-1 ring-inset ring-teal-200/20 transition-colors hover:bg-teal-300/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#082b30]">설치 없이 웹에서 먼저 보기 →</a>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-300">
          Google 로그인 후 이용할 수 있습니다. 중요한 진료 내용은 의료진이 다시 확인해 주세요.
        </p>
      </div>
    </section>
  );
}
