import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { AmbientList } from "@/components/ambient/AmbientList";

export const metadata = {
  title: "Suara Tenang — Flouwell",
  description: "Audio & video ambient untuk grounding, relaksasi, dan tidur.",
};

type Media = {
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  kind: "audio" | "video_direct" | "video_youtube" | "video_vimeo";
  media_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
};

export default async function AmbientPage() {
  const _blocked_ = await checkPremiumAccess("ambient-media");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("ambient_media")
    .select("slug, title, description, emoji, kind, media_url, thumbnail_url, tags")
    .eq("is_active", true)
    .not("media_url", "is", null)
    .order("sort_order");

  const items = (data ?? []) as Media[];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">🎵 Suara Tenang</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">← Beranda</Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/65">
        Audio & video ambient buat grounding, relaksasi, atau temenin lo pas butuh suasana tenang. Pakai earphone untuk effect maksimal.
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-base font-bold text-ink">Konten belum ready</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Admin lagi nyiapin. Cek lagi nanti.
          </p>
        </div>
      ) : (
        <AmbientList items={items} />
      )}
    </main>
  );
}
