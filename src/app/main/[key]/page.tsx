import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuiz } from "@/core/quizzes";
import { QuizRunner } from "@/components/QuizRunner";

export default async function QuizPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const quiz = getQuiz(key);
  if (!quiz) notFound();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">{quiz.emoji} {quiz.title}</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">{quiz.intro}</p>
      <QuizRunner quiz={quiz} />
    </main>
  );
}
