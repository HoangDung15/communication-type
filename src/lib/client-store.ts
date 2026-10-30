"use client";

import type { Choice } from "./questions";
import type { QuizResult } from "./mbti";

// Mọi thao tác storage đều bọc try/catch: chế độ ẩn danh hoặc trình duyệt chặn storage vẫn phải chạy được.

const KEYS = {
  quiz: "mbti.quiz.v1",
  result: "mbti.result.v1",
  attribution: "mbti.attribution.v1",
  thanks: "mbti.thanks.v1",
} as const;

const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function read<T>(storage: "local" | "session", key: string): T | null {
  try {
    const raw = (storage === "local" ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: "local" | "session", key: string, value: unknown) {
  try {
    (storage === "local" ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
  } catch {
    // bỏ qua
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // bỏ qua
  }
}

export type QuizProgress = { answers: (Choice | null)[]; current: number };

export const quizStore = {
  get: () => read<QuizProgress>("local", KEYS.quiz),
  set: (v: QuizProgress) => write("local", KEYS.quiz, v),
  clear: () => remove(KEYS.quiz),
};

// answers: 12 câu trả lời theo thứ tự, ví dụ "abaabbaabbab"
export type StoredResult = QuizResult & { field?: string; answers?: string };

export const resultStore = {
  get: () => read<StoredResult>("local", KEYS.result),
  set: (v: StoredResult) => write("local", KEYS.result, v),
  clear: () => remove(KEYS.result),
};

export type Attribution = {
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  savedAt: number;
};

export const attributionStore = {
  get: (): Attribution | null => {
    const v = read<Attribution>("local", KEYS.attribution);
    if (!v || Date.now() - v.savedAt > ATTRIBUTION_TTL_MS) return null;
    return v;
  },
  set: (v: Attribution) => write("local", KEYS.attribution, v),
};

// Chỉ giữ trong phiên hiện tại để hiển thị ở trang cảm ơn, không đưa lên URL.
export type ThanksInfo = { name: string; email: string; emailSent: boolean };

export const thanksStore = {
  get: () => read<ThanksInfo>("session", KEYS.thanks),
  set: (info: ThanksInfo) => write("session", KEYS.thanks, info),
};

export function resetAll() {
  quizStore.clear();
  resultStore.clear();
}
