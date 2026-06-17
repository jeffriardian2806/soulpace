import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Quiz } from "@/core/quizzes";
import { QuizRunner } from "@/components/QuizRunner";
import { checkPremiumAccess } from "@/components/PremiumGate";

export default async function QuizPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const _blocked_ = await checkPremiumAccess(key);
  if (_blocked_) return _blocked_;
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("slug, title, emoji, intro, questions, results")
    .eq("slug", key)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) notFound();
  const quiz: Quiz = {
    key: data.slug,
    title: data.title,
    emoji: data.emoji,
    intro: data.intro,
    questions: data.questions,
    results: data.results,
  };
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
