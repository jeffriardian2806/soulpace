import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstrumentForm } from "@/components/InstrumentForm";
import type { InstrumentPayload } from "@/app/admin/skrining/types";

export const metadata = { title: "Admin · Edit Instrumen — Soulpace" };

export default async function AdminSkriningEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const [{ data }, { data: catLinks }, { data: allCategories }] = await Promise.all([
    supabase
      .from("screening_instruments")
      .select(
        "id, slug, name, subtitle, prompt, crisis_item_position, sort_order, is_active, screening_items(position, text, reverse), screening_options(label, value, sort_order), screening_bands(min_score, max_score, label, advice)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("screening_instrument_categories").select("category_id").eq("instrument_id", id),
    supabase.from("categories").select("id, slug, name").eq("is_active", true).order("sort_order"),
  ]);

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
        <Link href="/admin/skrining" className="text-sm text-ink/50">← Kembali</Link>
        <p className="py-10 text-center text-sm text-ink/40">Instrumen tidak ditemukan.</p>
      </main>
    );
  }

  const d = data as {
    id: string;
    slug: string;
    name: string;
    subtitle: string;
    prompt: string;
    crisis_item_position: number | null;
    sort_order: number;
    is_active: boolean;
    screening_items: { position: number; text: string; reverse: boolean }[];
    screening_options: { label: string; value: number; sort_order: number }[];
    screening_bands: { min_score: number; max_score: number; label: string; advice: string }[];
  };

  const initial: InstrumentPayload = {
    id: d.id,
    slug: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    prompt: d.prompt,
    crisisItemPosition: d.crisis_item_position,
    isActive: d.is_active,
    sortOrder: d.sort_order,
    options: [...d.screening_options]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ label: o.label, value: o.value })),
    items: [...d.screening_items]
      .sort((a, b) => a.position - b.position)
      .map((i: { position: number; text: string; reverse: boolean }) => ({ text: i.text, reverse: i.reverse })),
    bands: [...d.screening_bands]
      .sort((a, b) => a.min_score - b.min_score)
      .map((b) => ({ min: b.min_score, max: b.max_score, label: b.label, advice: b.advice })),
    categoryIds: (catLinks ?? []).map((r: { category_id: number }) => r.category_id),
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/admin/skrining" className="text-sm text-ink/50">← Kembali</Link>
        <h1 className="text-xl font-medium text-ink">Edit: {d.name}</h1>
      </header>
      <InstrumentForm initial={initial} categories={(allCategories ?? []) as { id: number; slug: string; name: string }[]} />
    </main>
  );
}
