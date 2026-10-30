import { DIMENSIONS, QUESTIONS, type Choice, type Letter } from "./questions";

export const MBTI_TYPES = [
  "ENTJ", "ENFP", "INTP", "INFJ", "ESTJ", "ESTP", "ENTP", "ISFJ",
  "INTJ", "INFP", "ESFJ", "ISFP", "ISTJ", "ENFJ", "ESFP", "ISTP",
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];

export type Scores = Record<Letter, number>;

export type QuizResult = {
  type: MbtiType;
  scores: Scores;
};

export function isMbtiType(value: unknown): value is MbtiType {
  return typeof value === "string" && (MBTI_TYPES as readonly string[]).includes(value);
}

export function computeResult(answers: (Choice | null)[]): QuizResult | null {
  if (answers.length !== QUESTIONS.length || answers.some((a) => a === null)) return null;

  const scores: Scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  QUESTIONS.forEach((q, i) => {
    const dim = DIMENSIONS.find((d) => d.id === q.dimension)!;
    const letter = answers[i] === "a" ? dim.a.letter : dim.b.letter;
    scores[letter] += 1;
  });

  // Mỗi nhóm có 3 câu (số lẻ) nên không bao giờ hoà.
  const type = DIMENSIONS.map((d) => (scores[d.a.letter] > scores[d.b.letter] ? d.a.letter : d.b.letter)).join("");
  return isMbtiType(type) ? { type, scores } : null;
}

// Dạng gọn để lưu vào sheet, ví dụ "E3-I0 S1-N2 T2-F1 J3-P0".
export function formatScores(scores: Scores): string {
  return DIMENSIONS.map((d) => `${d.a.letter}${scores[d.a.letter]}-${d.b.letter}${scores[d.b.letter]}`).join(" ");
}
