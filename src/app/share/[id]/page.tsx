import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsService } from "@/modules/posts";
import { ShareCard } from "@/components/ShareCard";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const svc = await getPostsService();
  const post = await svc.getPost(id);
  if (!post) notFound();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-5 py-6">
      <Link href={`/post/${id}`} className="text-sm text-ink/50">
        ← Kembali
      </Link>
      <div>
        <h1 className="text-xl font-bold text-ink">Bagikan</h1>
        <p className="mt-1 text-sm text-ink/55">
          Bagikan ke story buat nguatin orang lain. Tetap anonim.
        </p>
      </div>
      <ShareCard text={post.body} />
    </main>
  );
}
