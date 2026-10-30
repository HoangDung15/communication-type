"use client";

import { useState } from "react";

const SMALL =
  "shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark ring-1 ring-line-strong hover:bg-peach-soft";

export function CopyButton({ text, label = "Sao chép", className = SMALL }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard: người dùng tự bôi đen để sao chép
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? "Đã sao chép" : label}
    </button>
  );
}
