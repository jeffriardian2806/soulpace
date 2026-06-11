import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ScreeningTool } from "@/components/ScreeningTool";
import type { ScreeningInstrument } from "@/config/screening";

export const metadata: Metadata = {
  title: "Skrining Kesehatan Mental — Soulpace",
  description:
    "Skrining mandiri kesehatan mental (mis. PHQ-9 & GAD-7). Alat bantu untuk mengenali gejala, bukan diagnosis.",
  robots: { index: true, follow: true },
};

type DbItem = { position: number; text: string; reverse: boolean };
type DbOption = { label: string; value: number; sort_order: number };
type DbBand = { min_score: number; max_score: number; label: string; advice: string };
type DbInstrument = {
  slug: string;
  name: string;
  subtitle: string;
  prompt: string;
  crisis_item_position: number | null;
  screening_items: DbItem[];
  screening_options: DbOption[];
  screening_bands: DbBand[];
};

function mapInstrument(d: DbInstrument): ScreeningInstrument {
  return {
    id: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    prompt: d.prompt,
    options: [...d.screening_options]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({ label: o.label, value: o.value })),
    items: [...d.screening_items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ text: i.text, reverse: i.reverse })),
    bands: [...d.screening_bands]
      .sort((a, b) => a.min_score - b.min_score)
      .map((b) => ({ min: b.min_score, max: b.max_score, label: b.label, advice: b.advice })),
    crisisItemIndex:
      d.crisis_item_position != null ? d.crisis_item_position - 1 : undefined,
  };
}

export default async function SkriningPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("screening_instruments")
    .select(
      "slug, name, subtitle, prompt, crisis_item_position, screening_items(position, text, reverse), screening_options(label, value, sort_order), screening_bands(min_score, max_score, label, advice)"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const instruments = ((data ?? []) as DbInstrument[]).map(mapInstrument);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Skrining Kesehatan Mental</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Kuesioner singkat buat mengenali gejala. Jawab apa adanya. Hasilnya cuma buat kamu sendiri.
      </p>
      <ScreeningTool instruments={instruments} />
    </main>
  );
}
