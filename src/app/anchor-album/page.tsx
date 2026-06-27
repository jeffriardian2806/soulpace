import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPremiumAccess } from "@/components/PremiumGate";
import { AnchorAlbumManager } from "@/components/anchor-album/AnchorAlbumManager";
import { listAnchorPhotosAction } from "./actions";

export const metadata = {
  title: "Anchor Album — Flouwell",
  description: "Foto pribadi buat visual anchor pas crisis. Private, encrypted.",
};

export default async function AnchorAlbumPage() {
  const _blocked_ = await checkPremiumAccess("anchor-album");
  if (_blocked_) return _blocked_;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/anchor-album");

  const items = await listAnchorPhotosAction();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-ink/50">← Profile</Link>
          <h1 className="text-lg font-bold text-ink">📸 Anchor Album</h1>
        </div>
      </header>

      <p className="text-xs leading-relaxed text-ink/65">
        Album personal lo. Upload foto-foto yang bikin lo inget moment positive — diri sendiri waktu happy, loved ones, pet, tempat aman, achievement. Pas crisis nanti, foto-foto ini bakal ditampilin sebagai anchor visual.
      </p>

      <AnchorAlbumManager initialItems={items} userId={user.id} />
    </main>
  );
}
