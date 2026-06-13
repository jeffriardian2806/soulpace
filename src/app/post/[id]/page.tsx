import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getRepliesService } from "@/modules/replies";
import { PostCard } from "@/components/PostCard";
import { ReplyForm } from "@/components/ReplyForm";
import { ReportButton } from "@/components/ReportButton";
import { createReplyAction } from "./actions";
import { createReportAction } from "@/app/_actions/report";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const postsSvc = await getPostsService();
  const post = await postsSvc.getPost(id);
  if (!post) notFound();

  const peluked = await postsSvc.pelukedIds([post.id], user?.id ?? null);
  const repliesSvc = await getRepliesService();
  const replies = await repliesSvc.listByPost(id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <Link href="/feed" className="text-sm text-ink/50">
        ← Kembali ke feed
      </Link>

      <PostCard post={post} peluked={peluked.has(post.id)} canReport={!!user} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink/70">
          Balasan ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <p className="text-sm text-ink/40">
            Belum ada balasan. Jadi yang pertama menguatkan.
          </p>
        ) : (
          replies.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  {r.authorHandle}
                </span>
                {r.isSurvivorReply && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    pernah ngalamin
                  </span>
                )}
                <span className="text-xs text-ink/40">
                  <span className='ml-2'>{timeAgo(r.createdAt)}</span>
                </span>
                {user && (
                  <span className="ml-auto">
                    <ReportButton
                      targetType="reply"
                      targetId={r.id}
                      action={createReportAction}
                    />
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {r.body}
              </p>
            </div>
          ))
        )}
      </section>

      {user ? (
        <ReplyForm postId={post.id} action={createReplyAction} />
      ) : (
        <div className="glass rounded-2xl p-4 text-sm text-ink/70">
          Mau ikut menguatkan?{" "}
          <Link href="/register" className="font-medium text-sky-600 underline">
            Buat akun
          </Link>{" "}
          atau{" "}
          <Link href="/login" className="font-medium text-sky-600 underline">
            masuk
          </Link>{" "}
          dulu.
        </div>
      )}
    </main>
  );
}
