export type Letter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type Choice = "a" | "b";

export type Dimension = {
  id: "EI" | "SN" | "TF" | "JP";
  // Nhãn hiển thị trong lúc làm bài: cố ý không lộ ký hiệu E/I... để người làm không bị dẫn dắt.
  quizLabel: string;
  a: { letter: Letter; name: string };
  b: { letter: Letter; name: string };
};

export type Question = {
  dimension: Dimension["id"];
  text: string;
  a: string;
  b: string;
};

export const DIMENSIONS: Dimension[] = [
  {
    id: "EI",
    quizLabel: "Cách bạn nạp năng lượng",
    a: { letter: "E", name: "Hướng ngoại" },
    b: { letter: "I", name: "Hướng nội" },
  },
  {
    id: "SN",
    quizLabel: "Cách bạn tiếp nhận thông tin",
    a: { letter: "S", name: "Giác quan" },
    b: { letter: "N", name: "Trực giác" },
  },
  {
    id: "TF",
    quizLabel: "Cách bạn ra quyết định",
    a: { letter: "T", name: "Lý trí" },
    b: { letter: "F", name: "Cảm xúc" },
  },
  {
    id: "JP",
    quizLabel: "Cách bạn sắp xếp công việc",
    a: { letter: "J", name: "Nguyên tắc" },
    b: { letter: "P", name: "Linh hoạt" },
  },
];

// Đáp án a luôn ứng với chữ cái đầu của nhóm (E, S, T, J), đáp án b ứng với chữ cái sau (I, N, F, P).
export const QUESTIONS: Question[] = [
  {
    dimension: "EI",
    text: "Trong các buổi gặp gỡ hoặc sự kiện đông người, bạn thường:",
    a: "Nhanh chóng hoà nhập, thích trò chuyện với nhiều người mới.",
    b: "Quan sát trước, chỉ thoải mái nói chuyện khi ai đó chủ động với bạn.",
  },
  {
    dimension: "EI",
    text: "Khi mệt mỏi hoặc cần “nạp năng lượng”, bạn thường:",
    a: "Muốn ra ngoài gặp gỡ bạn bè hoặc tham gia hoạt động sôi nổi.",
    b: "Muốn ở yên một mình để tĩnh tâm, nghỉ ngơi hoặc làm điều mình thích.",
  },
  {
    dimension: "EI",
    text: "Trong nhóm, bạn cảm thấy thoải mái hơn khi:",
    a: "Nói ra ý tưởng, thảo luận cùng mọi người để tìm giải pháp.",
    b: "Nghĩ kỹ trong đầu, tự mình suy ngẫm trước khi chia sẻ.",
  },
  {
    dimension: "SN",
    text: "Khi học hoặc làm việc, bạn có xu hướng:",
    a: "Tập trung vào chi tiết, bước cụ thể, làm từng phần rõ ràng.",
    b: "Muốn hiểu bức tranh tổng thể trước rồi mới đi vào chi tiết.",
  },
  {
    dimension: "SN",
    text: "Khi nghe ai đó kể chuyện, bạn quan tâm hơn đến:",
    a: "Các sự kiện, thời điểm và kết quả cụ thể.",
    b: "Ý nghĩa, thông điệp hoặc điều rút ra từ câu chuyện đó.",
  },
  {
    dimension: "SN",
    text: "Trước một ý tưởng mới, bạn thường:",
    a: "Xem xét tính khả thi, thực tế có làm được không.",
    b: "Hứng thú với sự sáng tạo, độc đáo, dù còn nhiều mơ hồ.",
  },
  {
    dimension: "TF",
    text: "Khi ra quyết định quan trọng, bạn ưu tiên:",
    a: "Suy nghĩ logic, dựa trên lý do và dữ kiện rõ ràng.",
    b: "Cân nhắc cảm xúc, giá trị cá nhân và ảnh hưởng đến người khác.",
  },
  {
    dimension: "TF",
    text: "Khi người khác mắc lỗi, bạn có xu hướng:",
    a: "Góp ý thẳng thắn để họ hiểu vấn đề và sửa sai.",
    b: "Nói khéo léo, tránh làm họ tổn thương.",
  },
  {
    dimension: "TF",
    text: "Trong xung đột hoặc tranh luận, bạn thường:",
    a: "Muốn tìm ra ai đúng – ai sai để giải quyết rõ ràng.",
    b: "Muốn duy trì hoà khí, tìm cách dung hoà để mọi người cùng vui.",
  },
  {
    dimension: "JP",
    text: "Khi có công việc hoặc mục tiêu, bạn thường:",
    a: "Lập kế hoạch, sắp xếp thứ tự và cố gắng hoàn thành đúng hạn.",
    b: "Làm việc tuỳ hứng, linh hoạt điều chỉnh theo tình hình.",
  },
  {
    dimension: "JP",
    text: "Không gian sống hoặc làm việc của bạn:",
    a: "Gọn gàng, mọi thứ được sắp xếp theo trật tự nhất định.",
    b: "Có hơi lộn xộn, nhưng bạn vẫn biết mình để gì ở đâu.",
  },
  {
    dimension: "JP",
    text: "Bạn thấy thoải mái hơn khi:",
    a: "Biết rõ lịch trình, có kế hoạch cụ thể cho từng ngày.",
    b: "Ngày trôi tự nhiên, bạn tự do chọn làm điều mình thích.",
  },
];
