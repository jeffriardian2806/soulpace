import Link from "next/link";
import type { Metadata } from "next";
import { ScreeningTool } from "@/components/ScreeningTool";

export const metadata: Metadata = {
  title: "Skrining Kesehatan Mental — Soulpace",
  description:
    "Skrining mandiri PHQ-9 (gejala depresi) dan GAD-7 (gejala kecemasan). Alat bantu untuk mengenali gejala, bukan diagnosis.",
  robots: { index: true, follow: true },
};

export default function SkriningPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Skrining Kesehatan Mental</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Dua kuesioner singkat buat mengenali gejala depresi dan kecemasan. Jawab apa adanya,
        sekitar 3 menit. Hasilnya cuma buat kamu sendiri.
      </p>
      <ScreeningTool />
    </main>
  );
}
