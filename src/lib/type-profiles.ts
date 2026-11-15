// Biệt danh, 3 nhãn và ảnh chibi cho từng nhóm MBTI (thẻ nhân vật ở trang kết quả).
// Nhãn rút từ câu mô tả phong cách trong results.json, đã làm mềm từ tiêu cực.

export type TypeProfile = { nickname: string; tags: [string, string, string] };

export const TYPE_PROFILES: Record<string, TypeProfile> = {
  ENTJ: { nickname: "Người cầm lái", tags: ["Rõ ràng", "Chiến lược", "Thuyết phục"] },
  ENFP: { nickname: "Người truyền lửa", tags: ["Ấm áp", "Cuốn hút", "Tích cực"] },
  INTP: { nickname: "Người suy ngẫm", tags: ["Điềm tĩnh", "Phân tích sâu", "Kiệm lời"] },
  INFJ: { nickname: "Người thấu cảm", tags: ["Sâu sắc", "Tinh tế", "Thấu cảm"] },
  ESTJ: { nickname: "Người tổ chức", tags: ["Rõ ràng", "Thực tế", "Nhanh nhạy"] },
  ESTP: { nickname: "Người hành động", tags: ["Quyết đoán", "Thực tế", "Cuốn hút"] },
  ENTP: { nickname: "Người khơi ý tưởng", tags: ["Linh hoạt", "Sắc bén", "Giàu năng lượng"] },
  ISFJ: { nickname: "Người chăm lo", tags: ["Ấm áp", "Chu đáo", "Tinh tế"] },
  INTJ: { nickname: "Nhà chiến lược", tags: ["Chiến lược", "Thẳng thắn", "Tinh tế"] },
  INFP: { nickname: "Người chân thành", tags: ["Thấu cảm", "Chân thành", "Nhẹ nhàng"] },
  ESFJ: { nickname: "Người kết nối", tags: ["Ấm áp", "Kết nối", "Tạo an toàn"] },
  ISFP: { nickname: "Người lắng nghe", tags: ["Nhẹ nhàng", "Chân thật", "Biết lắng nghe"] },
  ISTJ: { nickname: "Người đáng tin cậy", tags: ["Chuẩn xác", "Nghiêm túc", "Đáng tin"] },
  ENFJ: { nickname: "Người dẫn dắt", tags: ["Truyền cảm hứng", "Tinh tế", "Dẫn dắt"] },
  ESFP: { nickname: "Người tạo năng lượng", tags: ["Nhiệt thành", "Linh hoạt", "Lôi cuốn"] },
  ISTP: { nickname: "Người giải quyết", tags: ["Điềm tĩnh", "Thực tế", "Rõ ràng"] },
};

// Ảnh chibi: public/types/<mã viết thường>.webp, đủ cả 16 nhóm.
export function typeImage(type: string): string | null {
  return type in TYPE_PROFILES ? `/types/${type.toLowerCase()}.webp` : null;
}
