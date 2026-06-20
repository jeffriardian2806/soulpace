import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function AnchorAlbumEntryCard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { count } = await supabase
    .from("anchor_album_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const itemCount = count ?? 0;
  const isEmpty = itemCount === 0;

  return (
    <Link
      href="/anchor-album"
      className={`rounded-2xl p-4 ring-1 transition-colors ${
        isEmpty
          ? "bg-gradient-to-br from-purple-50 to-rose-50 ring-purple-200 hover:bg-purple-100/50"
          : "bg-gradient-to-br from-emerald-50 to-sky-50 ring-emerald-200 hover:bg-emerald-100/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">📸</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">
            Anchor Album{" "}
            {isEmpty ? (
              <span className="ml-1 rounded-full bg-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-800">belum diisi</span>
            ) : (
              <span className="ml-1 rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">{itemCount} foto</span>
            )}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
            {isEmpty
              ? "Upload foto moment positive — visual anchor lo pas crisis"
              : "Foto-foto anchor lo siap. Akan ditampilin di Crisis Mode."}
          </p>
        </div>
        <span className="text-xs text-sky-600">→</span>
      </div>
    </Link>
  );
}
