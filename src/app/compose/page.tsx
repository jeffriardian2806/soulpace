import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { ComposeForm } from "@/components/ComposeForm";
import { createPostAction } from "@/app/feed/actions";

export default async function ComposePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getPostsService();
  const categories = await svc.listCategories();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-medium text-ink">Tulis curhat</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/55">
        Lepasin aja apa yang kamu rasain. Boleh marah, boleh pakai kata kasar — yang
        penting jangan menyerang atau membahayakan orang lain.
      </p>
      <ComposeForm categories={categories} action={createPostAction} />
    </main>
  );
}
