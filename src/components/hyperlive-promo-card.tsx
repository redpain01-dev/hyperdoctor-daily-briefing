import Image from "next/image";

const HYPERLIVE_URL =
  "https://hyperlive.hyperdoctor.app/?utm_source=daily-briefing&utm_medium=feature-card&utm_campaign=hyperlive-medical-interpreter";

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
      </div>

      <div className="p-5">
        <p className="text-[10px] font-semibold tracking-wider text-teal-200">
          HYPERDOCTOR · 의료 통역
        </p>
        <h2 id="hyperlive-promo-title" className="mt-3 text-lg font-bold leading-snug">
          언어가 달라도, 진료 대화는 이어지도록.
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-200">
          외국인 환자와의 대화를 원문과 한국어로 나란히 확인하세요.
          하이퍼라이브의 실시간 통역과 함께 보기로 진료실의 소통을 도와드립니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-medium text-teal-50">
          {["실시간 통역", "원문·한국어 함께 보기", "환자 QR 연결"].map((feature) => (
            <span key={feature} className="rounded-full bg-white/8 px-2.5 py-1 ring-1 ring-inset ring-white/10">
              {feature}
            </span>
          ))}
        </div>
        <a
          href={HYPERLIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-300 px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-teal-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#082b30]"
        >
          하이퍼라이브 의료 통역 열기 →
        </a>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-300">
          Google 로그인 후 이용할 수 있습니다. 중요한 진료 내용은 의료진이 다시 확인해 주세요.
        </p>
      </div>
    </section>
  );
}
