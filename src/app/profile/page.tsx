import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostsService } from "@/modules/posts";
import { getProfilesService } from "@/modules/profiles";
import { PostCard } from "@/components/PostCard";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profilesSvc = await getProfilesService();
  const profile = await profilesSvc.getProfile(user.id);

  const postsSvc = await getPostsService();
  const posts = await postsSvc.listByAuthor(user.id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/feed" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-bold text-ink">Perjalananku</h1>
      </header>

      <div className="glass rounded-2xl p-4">
        <p className="text-lg font-semibold text-ink">{profile?.handle}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Ini ruang pribadimu. Hanya kamu yang bisa melihat halaman ini. Sesekali
          baca lagi, dan lihat sudah sejauh apa kamu bertahan.
        </p>
      </div>

      <p className="text-sm text-ink/55">{posts.length} curhat</p>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/40">
          Belum ada curhat. Perjalananmu dimulai dari sini.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} peluked={false} />
          ))}
        </div>
      )}
    </main>
  );
}
