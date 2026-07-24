import fs from "fs";
import path from "path";

export interface Notice {
  enabled: boolean;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string;
}

// JSON 대신 "키: 값" 한 줄짜리 평문 포맷을 쓴다. 따옴표·쉼표·중괄호를 안 건드려도
// 되니 GitHub 웹 편집기에서 실수 없이 고칠 수 있다.
function parse(raw: string): Notice {
  const fields: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    fields[key] = value;
  }

  const linkUrl = fields["링크"] || "";

  return {
    enabled: fields["켜짐"] === "예",
    title: fields["제목"] || "방장 공지",
    message: fields["내용"] || "",
    linkUrl: linkUrl ? linkUrl : null,
    linkLabel: fields["링크설명"] || "자세히 보기",
  };
}

export function getNotice(): Notice {
  const filePath = path.join(process.cwd(), "src/lib/data/notice.txt");
  const raw = fs.readFileSync(filePath, "utf-8");
  return parse(raw);
}
