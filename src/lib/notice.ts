import fs from "fs";
import path from "path";

export type NoticeMark = { type: "bold" } | { type: "link"; href: string };
export type NoticeSpan = { text: string; marks?: NoticeMark[] };
export type NoticeBlock =
  | { type: "paragraph"; children: NoticeSpan[] }
  | { type: "bulletList"; items: NoticeSpan[][] }
  | { type: "quote"; children: NoticeSpan[] }
  | { type: "image"; id: string; src: string; alt: string; caption?: string; width: number; height: number };

export interface Notice {
  schemaVersion: 1;
  enabled: boolean;
  title: string;
  blocks: NoticeBlock[];
  cta: { label: string; url: string; targetId: string } | null;
  publishedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSpan(value: unknown): value is NoticeSpan {
  if (!isRecord(value) || typeof value.text !== "string" || value.text.length > 5000) return false;
  if (value.marks === undefined) return true;
  return Array.isArray(value.marks) && value.marks.every((mark) => {
    if (!isRecord(mark)) return false;
    if (mark.type === "bold") return true;
    return mark.type === "link" && isHttpUrl(mark.href);
  });
}

function isBlock(value: unknown): value is NoticeBlock {
  if (!isRecord(value)) return false;
  if (value.type === "paragraph" || value.type === "quote") return Array.isArray(value.children) && value.children.every(isSpan);
  if (value.type === "bulletList") return Array.isArray(value.items) && value.items.length <= 30 && value.items.every((item) => Array.isArray(item) && item.every(isSpan));
  if (value.type === "image") {
    return typeof value.id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value.id)
      && typeof value.src === "string" && /^\/briefing-assets\/notices\/[a-zA-Z0-9/_-]+\.webp$/.test(value.src)
      && typeof value.alt === "string" && value.alt.length <= 160
      && (value.caption === undefined || (typeof value.caption === "string" && value.caption.length <= 240))
      && Number.isInteger(value.width) && Number(value.width) > 0 && Number(value.width) <= 1600
      && Number.isInteger(value.height) && Number(value.height) > 0 && Number(value.height) <= 1600;
  }
  return false;
}

function parseJson(raw: string): Notice | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.enabled !== "boolean") return null;
    if (typeof value.title !== "string" || value.title.length === 0 || value.title.length > 80) return null;
    if (!Array.isArray(value.blocks) || value.blocks.length > 60 || !value.blocks.every(isBlock)) return null;
    if (value.blocks.filter((block) => isRecord(block) && block.type === "image").length > 10) return null;
    let cta: Notice["cta"] = null;
    if (value.cta !== null) {
      if (!isRecord(value.cta) || typeof value.cta.label !== "string" || value.cta.label.length === 0 || value.cta.label.length > 40) return null;
      if (!isHttpUrl(value.cta.url) || typeof value.cta.targetId !== "string" || !/^notice-[a-z0-9-]{1,60}$/.test(value.cta.targetId)) return null;
      cta = { label: value.cta.label, url: value.cta.url, targetId: value.cta.targetId };
    }
    return {
      schemaVersion: 1,
      enabled: value.enabled,
      title: value.title,
      blocks: value.blocks,
      cta,
      ...(typeof value.publishedAt === "string" ? { publishedAt: value.publishedAt } : {}),
    };
  } catch {
    return null;
  }
}

function parseLegacy(raw: string): Notice {
  const fields: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const url = isHttpUrl(fields["링크"]) ? fields["링크"] : null;
  return {
    schemaVersion: 1,
    enabled: fields["켜짐"] === "예",
    title: fields["제목"] || "방장 공지",
    blocks: [{ type: "paragraph", children: [{ text: fields["내용"] || "" }] }],
    cta: url ? { label: fields["링크설명"] || "자세히 보기", url, targetId: "notice-primary-cta" } : null,
  };
}

export function getNotice(): Notice {
  const dataDirectory = path.join(process.cwd(), "src/lib/data");
  const jsonPath = path.join(dataDirectory, "notice.json");
  if (fs.existsSync(jsonPath)) {
    const parsed = parseJson(fs.readFileSync(jsonPath, "utf-8"));
    if (parsed) return parsed;
  }
  return parseLegacy(fs.readFileSync(path.join(dataDirectory, "notice.txt"), "utf-8"));
}
