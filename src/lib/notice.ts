import noticeData from "./data/notice.json";

export interface Notice {
  enabled: boolean;
  title: string;
  message: string;
  updatedAt: string;
}

export function getNotice(): Notice {
  return noticeData as Notice;
}
