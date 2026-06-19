import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { VisualFirstSightPlayer } from "@/components/visual/VisualFirstSightPlayer";

export const metadata = {
  title: "Mata Pertama — Soulpace",
  description: "Refleksi visual: apa yang kamu lihat pertama. Bukan diagnosis, just reflection.",
};

type Option = { label: string; emoji: string; interpretation: string };

export default async function MataPertamaPage() {
  const _blocked_ = await checkPremiumAccess("mata-pertama");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data } = await supabase
    .from("visual_first_sight_items")
    .select("slug, prompt, image_url, options, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  const items = ((data ?? []) as { slug: string; prompt: string; image_url: string; options: Option[] }[]);
  if (items.length === 0) redirect("/main");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">👁️ Mata Pertama</h1>
      </header>
      <p className="text-xs leading-relaxed text-ink/60">
        Lihat tiap gambar singkat. Pilih apa yang kamu lihat pertama — spontan aja, jangan overthink. Refleksi vibe kamu hari ini.
      </p>
      <VisualFirstSightPlayer items={items} />
    </main>
  );
}
