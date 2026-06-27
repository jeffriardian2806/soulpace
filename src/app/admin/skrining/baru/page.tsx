import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstrumentForm } from "@/components/InstrumentForm";

export const metadata = { title: "Admin · Tambah Instrumen — Flouwell" };

export default async function AdminSkriningBaruPage() {
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

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/admin/skrining" className="text-sm text-ink/50">
          ← Kembali
        </Link>
        <h1 className="text-xl font-medium text-ink">Tambah Instrumen</h1>
      </header>
      <InstrumentForm categories={(allCategories ?? []) as { id: number; slug: string; name: string }[]} />
    </main>
  );
}
