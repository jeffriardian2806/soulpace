// Tipe kuis. DATA sekarang di DB (tabel quizzes), bukan di sini lagi.
export interface QuizOption { label: string; type: string }
export interface QuizQuestion { text: string; options: QuizOption[] }
export interface QuizResult { label: string; desc: string; wish?: string }
export interface Quiz {
  key: string;
  title: string;
  emoji: string;
  intro: string;
  questions: QuizQuestion[];
  results: Record<string, QuizResult>;
}

export function computeResult(quiz: Quiz, answers: string[]): string {
  const tally: Record<string, number> = {};
  for (const t of answers) tally[t] = (tally[t] ?? 0) + 1;
  let best = answers[0] ?? Object.keys(quiz.results)[0];
  let max = -1;
  for (const [t, c] of Object.entries(tally)) if (c > max) { max = c; best = t; }
  return best;
}
