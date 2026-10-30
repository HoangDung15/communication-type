import { Book, Briefcase, Chart, Code, Cross, Flag, Heart, Megaphone, Star, Wrench } from "./icons";

// Chọn biểu tượng và màu theo tên lĩnh vực. Lĩnh vực mới thêm trong sheet mà không khớp từ khoá
// nào sẽ dùng biểu tượng cặp tài liệu, màu xoay vòng theo thứ tự.

const RULES: { match: RegExp; Icon: typeof Flag }[] = [
  { match: /lãnh đạo|quản lý/i, Icon: Flag },
  { match: /dịch vụ|chăm sóc/i, Icon: Heart },
  { match: /kinh tế|tài chính|kế toán|ngân hàng/i, Icon: Chart },
  { match: /sáng tạo|thiết kế|nghệ thuật/i, Icon: Star },
  { match: /giáo dục|đào tạo/i, Icon: Book },
  { match: /công nghệ|thông tin|\bIT\b/i, Icon: Code },
  { match: /kỹ thuật|cơ khí|xây dựng/i, Icon: Wrench },
  { match: /y tế|sức khoẻ|sức khỏe|dược/i, Icon: Cross },
  { match: /marketing|truyền thông|kinh doanh|bán hàng/i, Icon: Megaphone },
];

const TONES = [
  "bg-peach text-peach-ink",
  "bg-mint-soft text-mint-dark",
  "bg-sun-soft text-sun-ink",
  "bg-sky-soft text-sky-ink",
];

export function FieldIcon({ name, index, active }: { name: string; index: number; active?: boolean }) {
  const Icon = RULES.find((r) => r.match.test(name))?.Icon ?? Briefcase;
  const tone = active ? "bg-brand text-white" : TONES[index % TONES.length];
  return (
    <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
      <Icon size={22} />
    </span>
  );
}
