"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ZONE_LABELS, type ZoneKey } from "@/lib/zones-types";

// Ba vòng tròn lớn giao nhau + vùng giữa (FLOW_PLAN §4).
// Intro: tối cả màn hình, sáng lần lượt từng vòng 1 → 2 → 3 → vùng giữa để gợi ý nhấn.
// Nhấn vòng nào mở modal nội dung vùng đó, kết thúc intro ngay.
//
// Layout: 3 vòng cùng bán kính R, tâm tạo thành tam giác đều.
// Vùng giữa là giao THẬT của cả 3 vòng (clip lồng nhau), không phải ellipse đè lên.
// Màu pastel ấm, semi-transparent + multiply để vùng giao tự đậm lên.

const INTRO_ORDER: ZoneKey[] = ["z1", "z2", "z3", "yellow"];
const STEP_MS = 1400;
const R = 108;

// Tam giác đều, trọng tâm (200, ~207)
const CIRCLES: {
  key: Exclude<ZoneKey, "yellow">;
  cx: number;
  cy: number;
  fill: string;
  lines: string[];
}[] = [
  { key: "z1", cx: 200, cy: 140, fill: "#FFD98E", lines: ["Bạn là ai?"] },
  { key: "z2", cx: 142, cy: 240, fill: "#FFB38A", lines: ["Phong cách", "giao tiếp", "của bạn"] },
  { key: "z3", cx: 258, cy: 240, fill: "#9ADCC8", lines: ["Lĩnh vực", "của bạn", "cần gì"] },
];

// Điểm đặt nhãn ở phần riêng của mỗi vòng (lùi vào trong, tránh sát mép)
const LABEL_POS: Record<string, { x: number; y: number }> = {
  z1: { x: 200, y: 72 },
  z2: { x: 106, y: 272 },
  z3: { x: 294, y: 272 },
};

// Badge tick nằm trên đường viền ngoài mỗi vòng, hướng ra xa tâm biểu đồ (200, 207)
const BADGE_POS: Record<string, { x: number; y: number }> = {
  z1: { x: 200, y: 24 },
  z2: { x: 41, y: 297 },
  z3: { x: 359, y: 297 },
};

const CENTER = { x: 200, y: 207 };

export function CirclesDiagram({
  seen,
  onSelect,
}: {
  seen: Set<ZoneKey>;
  onSelect: (key: ZoneKey) => void;
}) {
  const [lit, setLit] = useState<ZoneKey[]>([]);
  const [introStep, setIntroStep] = useState(-1);
  const [introDone, setIntroDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clip1 = `venn-c1-${uid}`;
  const clip2 = `venn-c2-${uid}`;
  const clip3 = `venn-c3-${uid}`;

  // Reduced motion: bỏ intro, sáng hết ngay.
  // Intro: mỗi thời điểm chỉ sáng ĐÚNG MỘT vòng theo thứ tự 1 → 2 → 3 → giao,
  // các vòng còn lại chìm hẳn; xong mới sáng toàn bộ.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit([...INTRO_ORDER]);
      setIntroDone(true);
      return;
    }
    INTRO_ORDER.forEach((_, i) => {
      timers.current.push(setTimeout(() => setIntroStep(i), STEP_MS * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => {
        setLit([...INTRO_ORDER]);
        setIntroDone(true);
      }, STEP_MS * INTRO_ORDER.length + 400),
    );
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  function skipIntro() {
    if (introDone) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setLit([...INTRO_ORDER]);
    setIntroDone(true);
  }

  function pick(key: ZoneKey) {
    skipIntro();
    onSelect(key);
  }

  const dimmed = !introDone;
  // Trong intro: chỉ bước hiện tại sáng, các vòng khác chìm hẳn.
  // Sau intro: lit chứa đủ 4 key nên mọi thứ sáng.
  const isLit = (key: ZoneKey) => (introDone ? lit.includes(key) : INTRO_ORDER[introStep] === key);
  const yellowLit = isLit("yellow");
  const z2z3Lit = introDone ? lit.includes("z2") && lit.includes("z3") : introStep >= 2;

  return (
    <div className="flex w-full flex-col items-center">
      <style>{`
        .venn-circle { transition: opacity 0.7s ease, filter 0.7s ease; transform-box: fill-box; transform-origin: center; }
        .venn-circle:hover { filter: brightness(1.06) saturate(1.1); }
        .venn-center { transform-box: fill-box; transform-origin: center; transition: transform 0.25s ease, filter 0.25s ease; cursor: pointer; }
        .venn-center:hover { transform: scale(1.07); filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.95)); }
        .venn-center:active { transform: scale(0.97); }
        .venn-pulse { transform-box: fill-box; transform-origin: center; animation: venn-ping 1.6s ease-out infinite; pointer-events: none; }
        @keyframes venn-ping { 0% { transform: scale(0.85); opacity: 0.9; } 100% { transform: scale(1.25); opacity: 0; } }
        .venn-badge { animation: venn-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); transform-box: fill-box; transform-origin: center; }
        @keyframes venn-pop { 0% { transform: scale(0); } 100% { transform: scale(1); } }
        .venn-label { pointer-events: none; }
      `}</style>

      <div className="relative w-full">
        {/* Tối cả màn hình trong lúc giới thiệu */}
        {dimmed && (
          <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 bg-black/70 transition-opacity" />
        )}
        <svg
          viewBox="0 0 400 360"
          role="group"
          aria-label="Sơ đồ ba vòng tròn giao nhau"
          className="relative z-20 mx-auto aspect-[400/360] w-full max-w-[560px]"
          onClick={skipIntro}
          style={{ isolation: "isolate" }}
        >
          <defs>
            <filter id={`spot-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#ffffff" floodOpacity="0.9" />
            </filter>
            <clipPath id={clip1}>
              <circle cx={CIRCLES[0].cx} cy={CIRCLES[0].cy} r={R} />
            </clipPath>
            <clipPath id={clip2}>
              <circle cx={CIRCLES[1].cx} cy={CIRCLES[1].cy} r={R} />
            </clipPath>
            <clipPath id={clip3}>
              <circle cx={CIRCLES[2].cx} cy={CIRCLES[2].cy} r={R} />
            </clipPath>
          </defs>

          {/* Ba vòng tròn: pastel ấm, semi-transparent, multiply để vùng giao tự đậm */}
          {CIRCLES.map(({ key, cx, cy, fill }) => {
            const litNow = isLit(key);
            const seenIt = seen.has(key);
            return (
              <g
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  pick(key);
                }}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${key === "z1" ? ZONE_LABELS.z1 : key === "z2" ? ZONE_LABELS.z2 : ZONE_LABELS.z3}${seenIt ? " (đã xem)" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(key);
                  }
                }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={R}
                  fill={fill}
                  fillOpacity={litNow ? 0.72 : 0.12}
                  stroke={litNow ? "#ffffff" : "transparent"}
                  strokeWidth={litNow ? 3 : 0}
                  filter={litNow ? `url(#spot-glow-${uid})` : undefined}
                  className="venn-circle"
                  style={{ mixBlendMode: "multiply" }}
                />
                {/* Vòng pulse gợi ý nhấn cho vòng đang sáng */}
                {!introDone && litNow && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={R}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    className="venn-pulse"
                  />
                )}
                {/* Badge tick ở rìa ngoài vòng */}
                {seenIt && (
                  <g className="venn-badge">
                    <circle
                      cx={BADGE_POS[key].x}
                      cy={BADGE_POS[key].y}
                      r="15"
                      fill="#1a7f4b"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    <text
                      x={BADGE_POS[key].x}
                      y={BADGE_POS[key].y + 6}
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      ✓
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Vùng giao THẬT của cả 3 vòng: rect cắt qua 3 clip lồng nhau.
              Vẽ vùng giao đôi z2–z3 trước với màu ấm riêng để tránh tông xám
              do multiply của cam + mint chồng nhau. */}
          <g clipPath={`url(#${clip2})`}>
            <g clipPath={`url(#${clip3})`}>
              <rect
                x="0"
                y="0"
                width="400"
                height="360"
                fill="#F6C177"
                fillOpacity={z2z3Lit ? 0.85 : 0.12}
                className="venn-circle"
              />
            </g>
          </g>
          <g
            onClick={(e) => {
              e.stopPropagation();
              pick("yellow");
            }}
            className="venn-center"
            role="button"
            tabIndex={0}
            aria-label={`${ZONE_LABELS.yellow}${seen.has("yellow") ? " (đã xem)" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick("yellow");
              }
            }}
          >
            <g clipPath={`url(#${clip1})`}>
              <g clipPath={`url(#${clip2})`}>
                <g clipPath={`url(#${clip3})`}>
                  <rect
                    x="0"
                    y="0"
                    width="400"
                    height="360"
                    fill="#FFC93C"
                    fillOpacity={yellowLit ? 0.95 : 0.15}
                    className="venn-circle"
                  />
                </g>
              </g>
            </g>
            {/* Vùng chạm rộng hơn để dễ nhấn trên mobile */}
            <circle cx={CENTER.x} cy={CENTER.y} r="52" fill="transparent" />
            {yellowLit && !introDone && (
              <g clipPath={`url(#${clip1})`}>
                <g clipPath={`url(#${clip2})`}>
                  <g clipPath={`url(#${clip3})`}>
                    <rect
                      x="0"
                      y="0"
                      width="400"
                      height="360"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="6"
                    />
                  </g>
                </g>
              </g>
            )}
          </g>

          {/* Chữ ở vùng giao thật; badge nằm phía trên chữ, cách 12px+ */}
          <g className="venn-label" pointerEvents="none">
            <text
              x={CENTER.x}
              y={CENTER.y + 8}
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill={yellowLit ? "#5c3d00" : "#ffffff"}
              opacity={yellowLit ? 1 : 0.7}
              className="venn-circle"
            >
              {yellowLit ? "BẠN MUỐN TRỞ THÀNH" : "…"}
            </text>
            {seen.has("yellow") && (
              <g className="venn-badge">
                <circle cx={CENTER.x} cy={CENTER.y - 30} r="11" fill="#1a7f4b" stroke="#ffffff" strokeWidth="2.5" />
                <text x={CENTER.x} y={CENTER.y - 25} textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff">
                  ✓
                </text>
              </g>
            )}
          </g>

          {/* Nhãn mỗi vòng nằm trong phần riêng, không đè nhau */}
          {CIRCLES.map(({ key, lines }) => (
            <g key={`label-${key}`} className="venn-label" pointerEvents="none">
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={LABEL_POS[key].x}
                  y={LABEL_POS[key].y + li * 17}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill={isLit(key) ? "#3d2b00" : "#ffffff"}
                  opacity={isLit(key) ? 1 : 0}
                  className="venn-circle"
                >
                  {line}
                </text>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {!introDone && (
        <p className="relative z-20 mt-2 text-[13px] font-semibold text-white" aria-live="polite">
          Đang giới thiệu… chạm vào vòng sáng để xem ngay.
        </p>
      )}
      {introDone && (
        <ol className="mt-3 grid w-full max-w-[560px] grid-cols-1 gap-2.5 sm:grid-cols-3">
          {INTRO_ORDER.slice(0, 3).map((key, i) => (
            <li key={key} className="h-full">
              <button
                type="button"
                onClick={() => pick(key)}
                aria-pressed={seen.has(key)}
                className="flex h-full min-h-[88px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-line bg-white px-3 py-3 text-center text-sm font-bold text-body transition-colors hover:border-line-strong hover:bg-cream"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-track text-[13px] font-extrabold text-body">
                  {i + 1}
                </span>
                <span className="leading-snug">
                  {key === "z1" ? ZONE_LABELS.z1 : key === "z2" ? ZONE_LABELS.z2 : ZONE_LABELS.z3}
                </span>
                {seen.has(key) && <span className="text-[13px] font-semibold text-mint-dark">Đã xem ✓</span>}
              </button>
            </li>
          ))}
          <li className="sm:col-span-3">
            <button
              type="button"
              onClick={() => pick("yellow")}
              aria-pressed={seen.has("yellow")}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-sun-deep bg-[#fff8e1] px-4 py-3.5 text-center text-sm font-bold text-ink transition-colors hover:bg-sun-soft"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sun text-[13px] font-extrabold text-sun-ink">
                ✦
              </span>
              {ZONE_LABELS.yellow}
              {seen.has("yellow") && <span className="text-[13px] font-semibold text-mint-dark">✓</span>}
            </button>
          </li>
        </ol>
      )}
    </div>
  );
}
