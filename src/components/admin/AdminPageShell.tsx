import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export async function AdminPageShell({
  title,
  subtitle,
  pageKey,
  children,
  parentHref = "/admin/games",
  parentLabel = "← Admin Games",
}: {
  title: string;
  subtitle?: string;
  pageKey?: string;
  children: ReactNode;
  parentHref?: string;
  parentLabel?: string;
}) {
  // Teks dinamis: kalau pageKey ada, ambil override dari ui_texts (Rey bisa edit).
  let t = title;
  let st = subtitle;
  if (pageKey) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("ui_texts")
        .select("key, value")
        .in("key", [`admin.${pageKey}.title`, `admin.${pageKey}.subtitle`]);
      for (const row of data ?? []) {
        if (row.key.endsWith(".title") && row.value.trim()) t = row.value;
        if (row.key.endsWith(".subtitle") && row.value.trim()) st = row.value;
      }
    } catch { /* fallback ke hardcode */ }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href={parentHref} className="text-sm font-medium text-sky-600 hover:underline">
          {parentLabel}
        </Link>
        <Link href="/admin" className="text-sm font-medium text-sky-600 hover:underline">
          ⚙️ Pengaturan
        </Link>
      </header>
      <h1 className="text-xl font-bold text-ink">{t}</h1>
      {st && <p className="text-sm leading-relaxed text-ink/60">{st}</p>}
      {children}
    </main>
  );
}
