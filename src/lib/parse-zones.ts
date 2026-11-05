// Tách nội dung một ô kết quả (sheet mới) thành 4 zones cho sơ đồ ba vòng tròn.
//
// Format trong sheet (tiêu đề khớp theo ý nghĩa, tên trường/tên avatar thay đổi):
//   # <MBTI> – NGÀNH X                       ← kicker, bỏ khi hiển thị
//   ### GIAO ĐIỂM THỨ NHẤT: BẠN LÀ AI?       ← zone z1
//   **Hình ảnh đại diện: ...**                ← avatar của zone (nếu có)
//   ### GIAO ĐIỂM THỨ HAI: PHONG CÁCH ...    ← zone z2
//   ### GIAO ĐIỂM THỨ BA: NGÀNH X CẦN ...    ← zone z3
//   ### ĐIỂM GIAO MÀU VÀNG: THE <NAME>       ← zone yellow
//   ---
//   <đoạn promo cuối>                         ← bỏ, UI dùng CTA riêng

export type ZoneKey = "z1" | "z2" | "z3" | "yellow";

export type Zone = {
  key: ZoneKey;
  /** Nhãn ngắn cố định cho sơ đồ, khớp FLOW_PLAN. */
  label: string;
  /** Tiêu đề đầy đủ lấy từ dòng ### trong sheet. */
  title: string;
  /** Dòng "Hình ảnh đại diện: ..." trong zone, nếu có. */
  avatar: string | null;
  /** Nội dung còn lại của zone (giữ nguyên text, render bằng parseResult). */
  body: string;
};

export type Zones = Record<ZoneKey, Zone>;

const ZONE_LABELS: Record<ZoneKey, string> = {
  z1: "Bạn là ai?",
  z2: "Phong cách giao tiếp của bạn là gì?",
  z3: "Lĩnh vực của bạn cần người như thế nào?",
  yellow: "Tiềm năng giao tiếp của bạn",
};

const HEADER_PATTERNS: { key: ZoneKey; re: RegExp }[] = [
  // "### GIAO ĐIỂM THỨ NHẤT: ...", "## 1/ GIAO ĐIỂM THỨ NHẤT: ...", "1/ GIAO ĐIỂM THỨ NHẤT: ..."
  { key: "z1", re: /^(?:#{1,4}\s*)?(?:\d+\s*\/\s*)?GIAO ĐIỂM THỨ (?:NHẤT|1)\s*:?\s*(.*)$/i },
  { key: "z2", re: /^(?:#{1,4}\s*)?(?:\d+\s*\/\s*)?GIAO ĐIỂM THỨ (?:HAI|2)\s*:?\s*(.*)$/i },
  { key: "z3", re: /^(?:#{1,4}\s*)?(?:\d+\s*\/\s*)?GIAO ĐIỂM THỨ (?:BA|3)\s*:?\s*(.*)$/i },
  { key: "yellow", re: /^(?:#{1,4}\s*)?(?:\d+\s*\/\s*)?ĐIỂM GIAO MÀU VÀNG\s*:?\s*(.*)$/i },
];

const AVATAR_RE = /^(?:\*\*?)?\s*(?:[-•*]\s*)?Hình ảnh[^:]*:\s*(.+?)\s*(?:\*\*)?\s*$/i;
const PROMO_DIVIDER_RE = /^\s*-{3,}\s*$/;
const KICKER_RE = /^#\s+.*$/;

function matchHeader(line: string): { key: ZoneKey; title: string } | null {
  // Một số tab dùng **tiêu đề** thay cho heading Markdown.
  const heading = line.replace(/^\*\*(.+)\*\*$/, "$1").trim();
  for (const { key, re } of HEADER_PATTERNS) {
    const m = heading.match(re);
    if (m) return { key, title: m[1].trim() };
  }
  return null;
}

export function parseZones(raw: string): Zones | null {
  return diagnoseZones(raw).zones;
}

/** Chẩn đoán chi tiết một ô: zone nào có body, dòng `---` cắt ở đâu. */
export function diagnoseZones(raw: string): {
  z1: boolean;
  z2: boolean;
  z3: boolean;
  yellow: boolean;
  zones: Zones | null;
  partialZones: Partial<Zones>;
  promoCut: number;
} {
  // Bỏ đoạn promo sau dòng `---` (luôn ở cuối ô).
  const text = raw.replace(/\r\n?/g, "\n");
  const promoCut = text.split("\n").findIndex((l) => PROMO_DIVIDER_RE.test(l) || /^\s*[—–-]{3,}\s*$/.test(l));
  const usable = (promoCut >= 0 ? text.split("\n").slice(0, promoCut) : text.split("\n")).join("\n");

  const bodies: Partial<Record<ZoneKey, { title: string; lines: string[] }>> = {};
  let current: ZoneKey | null = null;

  for (const line of usable.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (KICKER_RE.test(trimmed) && !current) continue; // kicker `# MBTI – NGÀNH X`
    const h = matchHeader(trimmed);
    if (h) {
      current = h.key;
      bodies[current] = { title: h.title, lines: [] };
      continue;
    }
    if (current) bodies[current]!.lines.push(line);
  }

  const zone = (key: ZoneKey): Zone | null => {
    const b = bodies[key];
    if (!b) return null;
    let avatar: string | null = null;
    const rest: string[] = [];
    for (const line of b.lines) {
      const m = line.trim().match(AVATAR_RE);
      if (m && !avatar) {
        avatar = m[1].trim();
        continue;
      }
      rest.push(line);
    }
    // "Bao gồm / Hình ảnh / Lời dẫn" là hướng dẫn biên tập trong nguồn,
    // không phải nội dung kết quả để hiển thị cho người làm bài test.
    if (/^\*{0,2}Bao gồm:\*{0,2}$/i.test(rest[0]?.trim() ?? "")) {
      rest.shift();
      while (/^[-•]\s*(?:Hình ảnh người đại diện|Lời dẫn)/i.test(rest[0]?.trim() ?? "")) rest.shift();
    }
    const body = rest.join("\n").trim();
    if (!body) return null;
    return { key, label: ZONE_LABELS[key], title: b.title || ZONE_LABELS[key], avatar, body };
  };

  const z1 = zone("z1");
  const z2 = zone("z2");
  const z3 = zone("z3");
  const yellow = zone("yellow");
  const partialZones = Object.fromEntries(
    ([['z1', z1], ['z2', z2], ['z3', z3], ['yellow', yellow]] as const).filter(([, value]) => value),
  ) as Partial<Zones>;
  if (!z1 || !z2 || !z3 || !yellow) return { z1: !!z1, z2: !!z2, z3: !!z3, yellow: !!yellow, zones: null, partialZones, promoCut };
  return { z1: true, z2: true, z3: true, yellow: true, zones: { z1, z2, z3, yellow }, partialZones, promoCut };
}
