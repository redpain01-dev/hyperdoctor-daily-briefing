export type PollOption = { id: string; label: string };

export type PublicPoll = {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  startsAt: string;
  endsAt: string;
  selectionMode: "single" | "multiple";
  maxChoices: number;
};

export type PollResults = {
  totalVoters: number;
  totalSelections: number;
  counts: Record<string, number>;
};

export type PollSnapshot = {
  poll: PublicPoll | null;
  status: "scheduled" | "open" | "closed" | null;
  results: PollResults;
  serverTime: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

/** Validate the public boundary before using API values in the voting UI. */
export function parsePollSnapshot(value: unknown): PollSnapshot {
  const invalid = () => new Error("투표 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  if (!isRecord(value) || typeof value.serverTime !== "string" || !Number.isFinite(Date.parse(value.serverTime))) {
    throw invalid();
  }
  const results = value.results;
  if (!isRecord(results) || !isCount(results.totalVoters) || !isCount(results.totalSelections) || !isRecord(results.counts)) {
    throw invalid();
  }
  if (value.poll === null) {
    if (value.status !== null) throw invalid();
    return { poll: null, status: null, results: { totalVoters: 0, totalSelections: 0, counts: {} }, serverTime: value.serverTime };
  }
  const poll = value.poll;
  if (
    !isRecord(poll) || typeof poll.id !== "string" || !poll.id || poll.id.length > 100 ||
    typeof poll.title !== "string" || !poll.title.trim() || poll.title.length > 200 ||
    typeof poll.description !== "string" || poll.description.length > 2000 ||
    !Array.isArray(poll.options) || poll.options.length < 2 || poll.options.length > 20 ||
    typeof poll.startsAt !== "string" || typeof poll.endsAt !== "string" ||
    !Number.isFinite(Date.parse(poll.startsAt)) || !Number.isFinite(Date.parse(poll.endsAt)) ||
    Date.parse(poll.startsAt) >= Date.parse(poll.endsAt) ||
    (poll.selectionMode !== "single" && poll.selectionMode !== "multiple") ||
    !isCount(poll.maxChoices) || poll.maxChoices < 1 || poll.maxChoices > poll.options.length ||
    (poll.selectionMode === "single" && poll.maxChoices !== 1) ||
    (value.status !== "scheduled" && value.status !== "open" && value.status !== "closed")
  ) throw invalid();

  const options: PollOption[] = [];
  const counts: Record<string, number> = {};
  for (const option of poll.options) {
    if (!isRecord(option) || typeof option.id !== "string" || !option.id || option.id.length > 100 ||
      typeof option.label !== "string" || !option.label.trim() || option.label.length > 200 ||
      options.some((existing) => existing.id === option.id)) throw invalid();
    const count = results.counts[option.id];
    if (!isCount(count) || count > results.totalVoters) throw invalid();
    options.push({ id: option.id, label: option.label });
    Object.defineProperty(counts, option.id, { value: count, enumerable: true });
  }
  if (Object.values(counts).reduce((sum, count) => sum + count, 0) !== results.totalSelections ||
    results.totalVoters > results.totalSelections) throw invalid();

  return {
    poll: { id: poll.id, title: poll.title, description: poll.description, options, startsAt: poll.startsAt,
      endsAt: poll.endsAt, selectionMode: poll.selectionMode, maxChoices: poll.maxChoices },
    status: value.status,
    results: { totalVoters: results.totalVoters, totalSelections: results.totalSelections, counts },
    serverTime: value.serverTime,
  };
}
