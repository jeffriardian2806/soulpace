import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · Skrining — Flouwell" };

export default async function AdminSkriningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.role !== "moderator") redirect("/feed");

  const { data } = await supabase
    .from("screening_instruments")
    .select("id, slug, name, subtitle, is_active, sort_order")
    .order("sort_order", { ascending: true });
  const instruments = data ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Admin · Skrining</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Kelola instrumen skrining. Tambah gejala baru, ubah pertanyaan, atau atur skor.
      </p>

      <Link
        href="/admin/skrining/baru"
        className="rounded-xl bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
      >
        + Tambah instrumen
      </Link>

      <div className="flex flex-col gap-2">
        {instruments.map((i) => (
          <Link
            key={i.id}
            href={`/admin/skrining/${i.id}`}
            className="glass flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-50"
          >
            <span>
              <span className="text-sm font-semibold text-ink">{i.name}</span>
              <span className="block text-xs text-ink/55">
                <span>{i.subtitle}</span>{"  "}<span>/{i.slug}</span>
              </span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                i.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </Link>
        ))}
        {instruments.length === 0 && (
          <p className="py-8 text-center text-sm text-ink/40">Belum ada instrumen.</p>
        )}
      </div>
    </main>
  );
}
