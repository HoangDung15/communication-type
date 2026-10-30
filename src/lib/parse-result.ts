// Tách nội dung một ô kết quả thành các khối để hiển thị.
//
// Format trong sheet:
//   ENTJ – Phong cách giao tiếp | Rõ ràng, chiến lược, ...     ← dòng giới thiệu (lấy phần sau "|")
//   (Phiên bản dành riêng cho người làm ...)                    ← ghi chú nhỏ
//   ✨ Tổng quan phong cách giao tiếp                           ← dòng bắt đầu bằng emoji = mục mới
//   Điểm mạnh:                                                   ← dòng ngắn kết thúc bằng ":" = tiêu đề nhóm
//   👉 Mẹo:                                                      ← emoji + kết thúc bằng ":" = nhóm mẹo trong mục
//   • ...                                                        ← gạch đầu dòng
//   Đoạn văn thường ...                                          ← đoạn văn

export type Tone = "good" | "warn" | "tip" | "neutral";

export type Block =
  | { kind: "group"; title: string; tone: Tone; items: Item[] }
  | Item;

export type Item = { kind: "bullet"; text: string } | { kind: "para"; text: string } | { kind: "subhead"; text: string };

export type Section = { title: string; blocks: Block[] };

export type ParsedResult = { tagline: string | null; notes: string[]; sections: Section[] };

const EMOJI_START = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})[️‍\p{Extended_Pictographic}]*\s*/u;
const BULLET_START = /^[•●▪◦\-–*+]\s*/;

function toneOf(title: string): Tone {
  const t = title.toLowerCase();
  if (/mẹo|gợi ý|lời khuyên/.test(t)) return "tip";
  if (/mạnh|ưu điểm|thế mạnh/.test(t)) return "good";
  if (/yếu|lưu ý|hạn chế|nhược|cần cải thiện/.test(t)) return "warn";
  return "neutral";
}

function isGroupTitle(line: string): boolean {
  return line.endsWith(":") && line.length <= 60 && !BULLET_START.test(line);
}

export function parseResult(raw: string): ParsedResult {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim());

  let tagline: string | null = null;
  const notes: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  let group: Extract<Block, { kind: "group" }> | null = null;

  const ensureSection = (): Section => {
    if (!current) {
      current = { title: "Phân tích của bạn", blocks: [] };
      sections.push(current);
    }
    return current;
  };

  for (const line of lines) {
    if (!line) {
      // Dòng trống sau một nhóm đã có nội dung thì kết thúc nhóm đó.
      if (group && group.items.length > 0) group = null;
      continue;
    }

    if (EMOJI_START.test(line)) {
      const title = line.replace(EMOJI_START, "").trim();
      if (current && isGroupTitle(title)) {
        group = { kind: "group", title: title.slice(0, -1).trim(), tone: toneOf(title), items: [] };
        current.blocks.push(group);
        continue;
      }
      current = { title, blocks: [] };
      sections.push(current);
      group = null;
      continue;
    }

    // Phần giới thiệu trước mục đầu tiên
    if (!current) {
      if (tagline === null && line.includes("|")) {
        tagline = line.split("|").slice(1).join("|").trim() || null;
        continue;
      }
      if (/^\(.*\)$/.test(line)) {
        notes.push(line.slice(1, -1).trim());
        continue;
      }
    }

    if (isGroupTitle(line)) {
      // Tiêu đề ngay sau một nhóm chưa có nội dung (ví dụ "👉 Mẹo:" rồi "Thêm 1 câu nhỏ:")
      // thì là tiêu đề phụ bên trong nhóm đó.
      if (group && group.items.length === 0) {
        group.items.push({ kind: "subhead", text: line.slice(0, -1).trim() });
        continue;
      }
      group ={ kind: "group", title: line.slice(0, -1).trim(), tone: toneOf(line), items: [] };
      ensureSection().blocks.push(group);
      continue;
    }

    const item: Item = BULLET_START.test(line)
      ? { kind: "bullet", text: line.replace(BULLET_START, "") }
      : { kind: "para", text: line };
    if (group) group.items.push(item);
    else ensureSection().blocks.push(item);
  }

  return { tagline, notes, sections: sections.filter((s) => s.blocks.length > 0) };
}
