import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { editPostAction } from "@/app/feed/actions";
import { EditPostForm } from "@/components/EditPostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = await getPostsService();
  const post = await svc.getPostForEdit(id, user.id);
  if (!post) notFound();

  // server-side guard (UX): kalo udah lewat batas, tolak masuk page
  const ageMin = (Date.now() - new Date(post.createdAt).getTime()) / 60000;
  if (ageMin > 15) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Sudah lewat batas 15 menit setelah posting. Curhat ga bisa diedit lagi.
        </p>
      </main>
    );
  }
  if (post.replyCount > 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Curhat udah ada balasan, ga bisa diedit lagi biar konteks balasannya tetep jelas.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-bold text-ink">Edit Curhat</h1>
      </header>
      <p className="text-sm text-ink/60">
        Kamu bisa edit dalam 15 menit setelah posting, selama belum ada yang balas.
      </p>
      <EditPostForm
        postId={id}
        initialBody={post.body}
        initialMood={post.mood ?? ""}
        initialWish={post.wish ?? ""}
        action={editPostAction}
      />
    </main>
  );
}
