"use client";

import { useState } from "react";
import { AlertCircle, Chat, Check, ChevronDown, Sparkle } from "../icons";
import type { Block, Item, Section, Tone } from "@/lib/parse-result";

const VISIBLE_SECTIONS = 2;

const SECTION_ICONS = [
  { Icon: Sparkle, tone: "bg-sun-soft text-sun-ink" },
  { Icon: Chat, tone: "bg-peach text-peach-ink" },
  { Icon: Sparkle, tone: "bg-mint-soft text-mint-dark" },
];

const GROUP_STYLES: Record<Tone, { box: string; title: string; icon: string }> = {
  good: { box: "bg-mint-faint", title: "text-mint-dark", icon: "text-mint-dark" },
  warn: { box: "bg-peach-soft", title: "text-peach-ink", icon: "text-peach-ink" },
  tip: { box: "bg-sun-soft", title: "text-sun-ink", icon: "text-sun-ink" },
  neutral: { box: "bg-cream", title: "text-ink", icon: "text-brand-dark" },
};

export function ResultSections({ sections }: { sections: Section[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? sections : sections.slice(0, VISIBLE_SECTIONS);
  const hidden = sections.length - shown.length;

  return (
    <>
      {shown.map((section, i) => {
        const { Icon, tone } = SECTION_ICONS[i % SECTION_ICONS.length];
        return (
          <section key={i} className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-white px-4 py-5 lg:px-6 lg:py-6">
            <div className="flex items-center gap-2.5">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${tone}`}>
                <Icon size={20} />
              </span>
              <h2 className="text-lg font-bold leading-snug">{section.title}</h2>
            </div>
            {section.blocks.map((block, j) => (
              <BlockView key={j} block={block} />
            ))}
          </section>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-line-strong bg-white text-[15px] font-semibold text-brand-dark hover:bg-peach-soft"
        >
          Xem thêm {hidden} mục
          <ChevronDown size={18} />
        </button>
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind !== "group") return <ItemView item={block} />;
  const style = GROUP_STYLES[block.tone];
  return (
    <div className={`rounded-2xl p-3.5 ${style.box}`}>
      <h3 className={`mb-2.5 text-[15px] font-bold ${style.title}`}>{block.title}</h3>
      <ItemList items={block.items} tone={block.tone} />
    </div>
  );
}

function ItemList({ items, tone }: { items: Item[]; tone: Tone }) {
  const style = GROUP_STYLES[tone];
  const BulletIcon = tone === "warn" ? AlertCircle : Check;
  return (
    <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed">
      {items.map((item, i) =>
        item.kind === "subhead" ? (
          <p key={i} className="font-semibold">
            {item.text}
          </p>
        ) : item.kind === "bullet" ? (
          <div key={i} className="flex gap-2.5">
            <BulletIcon size={18} className={`mt-[3px] shrink-0 ${style.icon}`} />
            <span>{item.text}</span>
          </div>
        ) : (
          <p key={i}>{item.text}</p>
        ),
      )}
    </div>
  );
}

function ItemView({ item }: { item: Item }) {
  if (item.kind === "bullet") {
    return (
      <div className="flex gap-2.5 text-[15px] leading-relaxed">
        <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand" />
        <span>{item.text}</span>
      </div>
    );
  }
  return <p className={`text-[15px] leading-[1.65] ${item.kind === "subhead" ? "font-semibold" : ""}`}>{item.text}</p>;
}
