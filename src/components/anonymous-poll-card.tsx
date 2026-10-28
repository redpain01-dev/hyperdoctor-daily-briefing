"use client";

import { useEffect, useRef, useState } from "react";
import { parsePollSnapshot, type PollSnapshot, type PublicPoll, type PollResults } from "@/lib/poll-types";

const DEFAULT_ENDPOINT = "https://briefing-admin.hyperdoctor.app/api/public/poll";
const COLORS = ["#0f766e", "#6366f1", "#d97706", "#db2777", "#0284c7", "#7c3aed", "#65a30d", "#be123c", "#475569", "#a16207"];
const PRIVACY_NOTICE = "이름·이메일 없이 익명으로 참여합니다. 중복 참여 방지를 위해 이 브라우저에 임의 식별값을 저장합니다.";
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});

type ReceivedPoll = { snapshot: PollSnapshot; receivedAt: number };
type Receipt = { optionIds: string[] };

function receiptKey(pollId: string) { return `briefing-poll:${pollId}:receipt`; }

function readReceipt(pollId: string): Receipt | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(receiptKey(pollId)) ?? "null");
    if (typeof saved === "object" && saved !== null && "optionIds" in saved &&
      Array.isArray(saved.optionIds) && saved.optionIds.every((id) => typeof id === "string")) {
      return { optionIds: saved.optionIds };
    }
  } catch { /* An unavailable receipt never substitutes for the server duplicate check. */ }
  return null;
}

function getVoterToken(pollId: string): string {
  const key = `briefing-poll:${pollId}:token`;
  try {
    const existing = localStorage.getItem(key);
    if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(key, token);
    return token;
  } catch {
    throw new Error("익명 참여 정보를 저장할 수 없습니다. 브라우저의 사이트 저장 공간을 허용한 뒤 다시 시도해 주세요.");
  }
}

function PollChart({ poll, results }: { poll: PublicPoll; results: PollResults }) {
  const segments = poll.options.flatMap((option, index) => {
    const portion = results.totalSelections ? (results.counts[option.id] / results.totalSelections) * 100 : 0;
    const preceding = poll.options.slice(0, index).reduce((sum, item) => sum + results.counts[item.id], 0);
    const start = results.totalSelections ? (preceding / results.totalSelections) * 100 : 0;
    return portion ? [`${COLORS[index % COLORS.length]} ${start}% ${start + portion}%`] : [];
  });
  const background = segments.length ? `conic-gradient(${segments.join(", ")})` : "#e2e8f0";

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">실시간 투표 결과</h3>
        <span className="text-[11px] text-slate-500">총 {results.totalVoters.toLocaleString("ko-KR")}명 참여</span>
      </div>
      <div className="mx-auto my-5 flex h-36 w-36 items-center justify-center rounded-full" style={{ background }} role="img"
        aria-label={`투표 결과 원형 그래프: ${poll.options.map((option) => `${option.label} ${results.counts[option.id]}표`).join(", ")}`}>
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white" aria-hidden="true">
          <span className="text-2xl font-bold tabular-nums text-slate-900">{results.totalVoters.toLocaleString("ko-KR")}</span>
          <span className="mt-0.5 text-[11px] text-slate-500">명 참여</span>
        </div>
      </div>
      {results.totalVoters === 0 && <p className="mb-4 text-center text-xs text-slate-500">첫 번째 의견을 들려주세요.</p>}
      <ul className="space-y-2.5" aria-label="선택지별 득표 수와 비율">
        {poll.options.map((option, index) => {
          const count = results.counts[option.id];
          const percentage = results.totalSelections ? (count / results.totalSelections) * 100 : 0;
          return (
            <li className="flex items-center gap-2 text-xs" key={option.id}>
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="min-w-0 flex-1 break-words text-slate-700">{option.label}</span>
              <span className="shrink-0 tabular-nums text-slate-500">{count.toLocaleString("ko-KR")}표</span>
              <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-slate-800">{percentage.toFixed(1)}%</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
        {poll.selectionMode === "multiple" ? "복수 선택 투표입니다. 그래프 비율은 전체 선택 수를 기준으로 표시합니다. " : ""}
        투표 직후 결과가 반영되며, 이 코너를 보는 동안 10초마다 갱신됩니다.
      </p>
    </div>
  );
}

function PollBody({ received, submitVote }: {
  received: ReceivedPoll;
  submitVote: (pollId: string, optionIds: string[]) => Promise<"voted" | "already-voted">;
}) {
  const poll = received.snapshot.poll!;
  const [receipt, setReceipt] = useState<Receipt | null>(() => readReceipt(poll.id));
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [clock, setClock] = useState(received.receivedAt);
  const pendingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // The server supplies the reference time, so a wrong device clock cannot open a closed poll.
  const now = Date.parse(received.snapshot.serverTime) + Math.max(0, clock - received.receivedAt);
  const status = received.snapshot.status === "closed" || now >= Date.parse(poll.endsAt)
    ? "closed" : now < Date.parse(poll.startsAt) ? "scheduled" : "open";
  const canVote = status === "open" && !receipt && !pending;
  const multiple = poll.selectionMode === "multiple";

  async function vote(optionIds: string[]) {
    if (!canVote || pendingRef.current || optionIds.length === 0) return;
    pendingRef.current = true;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const outcome = await submitVote(poll.id, optionIds);
      const saved: Receipt = { optionIds: outcome === "voted" ? optionIds : [] };
      setReceipt(saved);
      try { localStorage.setItem(receiptKey(poll.id), JSON.stringify(saved)); } catch { /* The server still remembers this token. */ }
      setMessage(outcome === "voted" ? "익명 투표가 반영됐습니다. 참여해 주셔서 감사합니다." : "이 브라우저에서 이미 참여한 투표입니다.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "투표를 전송하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  function choose(id: string) {
    if (!canVote) return;
    if (!multiple) {
      setSelected([id]);
      void vote([id]);
      return;
    }
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < poll.maxChoices ? [...current, id] : current);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide text-teal-700">독자들의 생각 · 익명 투표</p>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "open" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
          {status === "open" ? "진행 중" : status === "scheduled" ? "시작 예정" : "투표 마감"}
        </span>
      </div>
      <h2 id="anonymous-poll-title" className="mt-3 break-words text-lg font-bold leading-snug text-slate-900">{poll.title}</h2>
      {poll.description && <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-slate-600">{poll.description}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        {status === "scheduled" ? "시작 " : "마감 "}
        <time dateTime={status === "scheduled" ? poll.startsAt : poll.endsAt}>{dateFormatter.format(new Date(status === "scheduled" ? poll.startsAt : poll.endsAt))}</time> · 한국시간
      </p>
      <p className="mt-3 rounded-xl bg-teal-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-teal-900">{PRIVACY_NOTICE}</p>

      {!receipt && status !== "closed" && (
        <div className="mt-4" role="group" aria-label="투표 선택지" aria-describedby="anonymous-poll-choice-hint">
          <p id="anonymous-poll-choice-hint" className="mb-2 text-[11px] text-slate-500">
            {multiple ? `최대 ${poll.maxChoices}개까지 선택한 뒤 투표해 주세요.` : "항목을 누르면 바로 투표됩니다. 한 가지만 선택해 주세요."}
          </p>
          <div className="space-y-2">
            {poll.options.map((option, index) => {
              const isSelected = selected.includes(option.id);
              const limitReached = multiple && !isSelected && selected.length >= poll.maxChoices;
              return (
                <button key={option.id} type="button" aria-pressed={isSelected} onClick={() => choose(option.id)} disabled={!canVote || limitReached}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-700 enabled:hover:border-teal-400 enabled:hover:bg-teal-50/50"}`}>
                  <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isSelected ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{isSelected ? "✓" : index + 1}</span>
                  <span className="min-w-0 break-words">{option.label}</span>
                </button>
              );
            })}
          </div>
          {multiple && <button type="button" onClick={() => void vote(selected)} disabled={!canVote || selected.length === 0}
            className="mt-3 min-h-12 w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white transition-colors enabled:hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "투표 반영 중…" : `${selected.length > 0 ? `${selected.length}개 선택 · ` : ""}익명으로 투표하기`}
          </button>}
        </div>
      )}
      <p role={failed ? "alert" : "status"} aria-live="polite" className={`mt-3 text-xs leading-relaxed ${failed ? "text-red-700" : "text-teal-800"}`}>
        {message || (pending ? "투표를 반영하고 있습니다…" : receipt ? "이 브라우저에서 참여한 투표입니다. 감사합니다." : status === "closed" ? "투표가 마감되었습니다. 최종 결과를 확인해 주세요." : status === "scheduled" ? "투표 시작 시간이 되면 참여할 수 있습니다." : "")}
      </p>
      {receipt && receipt.optionIds.length > 0 && <p className="mt-1 text-[11px] text-slate-500">내 선택: {poll.options.filter((option) => receipt.optionIds.includes(option.id)).map((option) => option.label).join(", ")}</p>}
      <PollChart poll={poll} results={received.snapshot.results} />
    </>
  );
}

export function AnonymousPollCard({ endpoint = DEFAULT_ENDPOINT }: { endpoint?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const refreshRef = useRef<() => void>(() => undefined);
  const [received, setReceived] = useState<ReceivedPoll | null>(null);
  const [refreshError, setRefreshError] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    let inViewport = !window.IntersectionObserver;
    let failures = 0;
    let nextRefresh = 0;

    async function refresh(force = false) {
      if (!mountedRef.current || submittingRef.current || requestRef.current || document.hidden || !inViewport || (!force && Date.now() < nextRefresh)) return;
      const controller = new AbortController();
      requestRef.current = controller;
      const requestId = ++requestIdRef.current;
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(endpoint, { cache: "no-store", credentials: "omit", headers: { Accept: "application/json" }, signal: controller.signal });
        if (!response.ok) throw new Error("투표 결과를 갱신하지 못했습니다.");
        const snapshot = parsePollSnapshot(await response.json());
        if (mountedRef.current && requestId === requestIdRef.current) {
          setReceived({ snapshot, receivedAt: Date.now() });
          setRefreshError("");
        }
        failures = 0;
      } catch {
        if (mountedRef.current && requestId === requestIdRef.current) {
          setRefreshError("투표 정보를 갱신하지 못했습니다. 연결이 복구되면 자동으로 다시 확인합니다.");
          failures += 1;
        }
      } finally {
        window.clearTimeout(timeout);
        if (requestRef.current === controller) requestRef.current = null;
        nextRefresh = failures ? Date.now() + Math.min(10000 * 2 ** failures, 60000) : 0;
      }
    }

    const refreshNow = () => { void refresh(true); };
    refreshRef.current = refreshNow;
    const observer = window.IntersectionObserver ? new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      if (inViewport) refreshNow();
    }, { rootMargin: "100px" }) : null;
    if (hostRef.current) observer?.observe(hostRef.current);
    if (!observer) refreshNow();
    const interval = window.setInterval(() => { void refresh(); }, 10000);
    window.addEventListener("focus", refreshNow);
    window.addEventListener("online", refreshNow);
    document.addEventListener("visibilitychange", refreshNow);
    return () => {
      mountedRef.current = false;
      requestIdRef.current = requestIdRef.current + 1;
      requestRef.current?.abort();
      requestRef.current = null;
      observer?.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener("online", refreshNow);
      document.removeEventListener("visibilitychange", refreshNow);
    };
  }, [endpoint]);

  async function submitVote(pollId: string, optionIds: string[]): Promise<"voted" | "already-voted"> {
    if (submittingRef.current) throw new Error("투표를 반영하고 있습니다. 잠시 기다려 주세요.");
    const voterToken = getVoterToken(pollId);
    submittingRef.current = true;
    const requestId = ++requestIdRef.current;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let alreadyVoted = false;
    try {
      const response = await fetch(endpoint, {
        method: "POST", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ pollId, optionIds, voterToken }), signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const error = typeof data === "object" && data !== null ? data as { error?: unknown; code?: unknown } : {};
        if (response.status === 409 && error.code === "already_voted") { alreadyVoted = true; return "already-voted"; }
        throw new Error(typeof error.error === "string" ? error.error : "투표를 반영하지 못했습니다. 다시 시도해 주세요.");
      }
      const snapshot = parsePollSnapshot(data);
      if (mountedRef.current && requestId === requestIdRef.current) {
        setReceived({ snapshot, receivedAt: Date.now() });
        setRefreshError("");
      }
      return "voted";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new Error("응답이 지연되고 있습니다. 다시 눌러도 같은 투표가 중복 집계되지 않습니다.");
      throw error;
    } finally {
      window.clearTimeout(timeout);
      submittingRef.current = false;
      if (requestRef.current === controller) requestRef.current = null;
      if (alreadyVoted && mountedRef.current) refreshRef.current();
    }
  }

  return (
    <div ref={hostRef} data-anonymous-poll className={received && !received.snapshot.poll ? "min-h-px" : ""}>
      {(!received || received.snapshot.poll) && <section aria-labelledby="anonymous-poll-title" className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        {received?.snapshot.poll ? <PollBody
          key={JSON.stringify([received.snapshot.poll.id, received.snapshot.poll.title, received.snapshot.poll.options, received.snapshot.poll.selectionMode, received.snapshot.poll.maxChoices])}
          received={received}
          submitVote={submitVote}
        /> : <>
          <h2 id="anonymous-poll-title" className="text-sm font-bold text-teal-700">독자들의 생각 · 익명 투표</h2>
          <p className="mt-3 text-xs leading-relaxed text-slate-500" role="status">{refreshError ? "투표 정보를 불러오지 못했습니다." : "투표 정보를 불러오고 있습니다…"}</p>
        </>}
        {refreshError && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900" role="status">
          <p>{refreshError}{received?.snapshot.poll ? " 표시된 수치는 마지막으로 확인한 결과입니다." : ""}</p>
          <button type="button" onClick={() => refreshRef.current()} className="mt-1 min-h-11 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">다시 불러오기</button>
        </div>}
      </section>}
    </div>
  );
}
