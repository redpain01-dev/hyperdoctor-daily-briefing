import fs from "fs";
import path from "path";

export const SECTION_IDS = [
  "daily-quote",
  "weather",
  "market",
  "medilog",
  "tax-calendar",
  "medical-news",
  "journal",
  "clinical-english",
  "hyper-soap",
  "notice",
  "advertisement",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type SectionConfigEntry = { id: SectionId; visible: boolean };
export type SectionConfig = { schemaVersion: 1; sections: SectionConfigEntry[]; publishedAt?: string };

export function createDefaultSectionConfig(): SectionConfig {
  return { schemaVersion: 1, sections: SECTION_IDS.map((id) => ({ id, visible: true })) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSectionConfig(value: unknown): SectionConfig | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.sections)) return null;
  const sections: SectionConfigEntry[] = [];
  for (const entry of value.sections) {
    if (!isRecord(entry) || !SECTION_IDS.includes(entry.id as SectionId) || typeof entry.visible !== "boolean") return null;
    sections.push({ id: entry.id as SectionId, visible: entry.visible });
  }
  const ids = sections.map((entry) => entry.id);
  if (ids.length !== SECTION_IDS.length || new Set(ids).size !== ids.length || SECTION_IDS.some((id) => !ids.includes(id))) return null;
  if (value.publishedAt !== undefined && (typeof value.publishedAt !== "string" || Number.isNaN(Date.parse(value.publishedAt)))) return null;
  return {
    schemaVersion: 1,
    sections,
    ...(typeof value.publishedAt === "string" ? { publishedAt: value.publishedAt } : {}),
  };
}

export function getSectionConfig(): SectionConfig {
  const filePath = path.join(process.cwd(), "src/lib/data/sections.json");
  if (!fs.existsSync(filePath)) return createDefaultSectionConfig();
  try {
    return parseSectionConfig(JSON.parse(fs.readFileSync(filePath, "utf-8"))) ?? createDefaultSectionConfig();
  } catch {
    return createDefaultSectionConfig();
  }
}
