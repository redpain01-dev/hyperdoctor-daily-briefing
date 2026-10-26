type StoreKind = "microsoft" | "google-play";

function WindowsLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`${className} shrink-0 text-[#0078d4]`}>
      <path fill="currentColor" d="M2.5 4.2 10.7 3v8.2H2.5V4.2Zm9.4-1.4L21.5 1.4v9.8h-9.6V2.8ZM2.5 12.5h8.2v8.2l-8.2-1.2v-7Zm9.4 0h9.6v9.8l-9.6-1.4v-8.4Z" />
    </svg>
  );
}

function GooglePlayLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={`${className} shrink-0`}>
      <path fill="#00d8ff" d="M6 4.6v38.8L27.1 24 6 4.6Z" />
      <path fill="#00ef77" d="m6 4.6 25.9 14.9-4.8 4.5L6 4.6Z" />
      <path fill="#ffdf00" d="m27.1 24 4.8 4.5L6 43.4 27.1 24Z" />
      <path fill="#ff3a44" d="m31.9 19.5 8.3 4.8c1.2.7 1.2 2.5 0 3.2l-8.3 4.8-4.8-8.3 4.8-4.5Z" />
    </svg>
  );
}

export function StoreInstallLink({
  store,
  href,
  product,
}: {
  store: StoreKind;
  href: string;
  product: string;
}) {
  const isMicrosoft = store === "microsoft";
  const storeName = isMicrosoft ? "Microsoft Store" : "Google Play";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${storeName}에서 ${product} 설치 (새 창)`}
      data-store-install={store}
      className="group flex min-h-14 items-center gap-3 rounded-xl bg-white px-3.5 py-3 text-left text-slate-950 shadow-sm ring-1 ring-inset ring-slate-200 transition-transform hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
    >
      {isMicrosoft ? <WindowsLogo /> : <GooglePlayLogo />}
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold tracking-wide text-slate-500">
          {storeName}
        </span>
        <span className="mt-0.5 block text-sm font-bold">앱 설치하기</span>
      </span>
      <span aria-hidden="true" className="text-sm text-slate-400 transition-transform group-hover:translate-x-0.5">
        ↗
      </span>
    </a>
  );
}

export function StoreRegistrationBadge({ store }: { store: StoreKind }) {
  const isMicrosoft = store === "microsoft";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white ring-1 ring-inset ring-white/15">
      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white">
        {isMicrosoft ? <WindowsLogo className="h-3 w-3" /> : <GooglePlayLogo className="h-3.5 w-3.5" />}
      </span>
      {isMicrosoft ? "Microsoft Store 등록" : "Google Play 등록"}
    </span>
  );
}
