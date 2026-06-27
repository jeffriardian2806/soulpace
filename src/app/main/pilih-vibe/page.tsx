import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { VisualPairChoicePlayer } from "@/components/visual/VisualPairChoicePlayer";

export const metadata = {
  title: "Pilih Vibe — Flouwell",
  description: "Refleksi visual: forced choice pair grafis. Vibe profile kamu hari ini.",
};

type PairOption = { label: string; image_url: string; traits: Record<string, number> };
type Item = { slug: string; prompt: string; option_a: PairOption; option_b: PairOption };
type Profile = { slug: string; name: string; emoji: string | null; description: string; dominant_traits: string[] };

export default async function PilihVibePage() {
  const _blocked_ = await checkPremiumAccess("pilih-vibe");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const [{ data: itemsRow, error: itemsErr }, { data: profilesRow, error: profilesErr }] = await Promise.all([
    supabase.from("visual_pair_choice_items").select("slug, prompt, option_a, option_b, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("visual_vibe_profiles").select("slug, name, emoji, description, dominant_traits").eq("is_active", true).order("sort_order"),
  ]);

  const items = ((itemsRow ?? []) as Item[]);
  const profiles = ((profilesRow ?? []) as Profile[]);
  const err = itemsErr ?? profilesErr;

  if (err || items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
        <header className="flex items-center gap-3">
          <Link href="/main" className="text-sm text-ink/50">← Main</Link>
          <h1 className="text-lg font-bold text-ink">🎨 Pilih Vibe</h1>
        </header>
        <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <p className="text-3xl">🔧</p>
          <p className="mt-2 text-base font-bold text-ink">Fitur belum siap</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">
            Konten visual belum ada di database. Admin perlu run migration <code className="rounded bg-ink/5 px-1 py-0.5 text-xs">0035_soulpace_visual_reflection.sql</code> dulu.
          </p>
          {err && (
            <p className="mt-2 text-[10px] text-rose-600 italic">Error: {err.message}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🎨 Pilih Vibe</h1>
      </header>
      <p className="text-xs leading-relaxed text-ink/60">
        Pilih 1 dari 2 grafis per pair — yang langsung narik mata. Jangan overthink. Di akhir keluar vibe profile kamu.
      </p>
      <VisualPairChoicePlayer items={items} profiles={profiles} />
    </main>
  );
}
