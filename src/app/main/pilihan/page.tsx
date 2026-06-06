import Link from "next/link";
import { ThisOrThat } from "@/components/ThisOrThat";

export const metadata = { title: "Ini atau Itu — Soulpace" };

export default function PilihanPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">🌙 Ini atau Itu</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">Check-in 1 menit. Pilih yang lebih kamu rasain.</p>
      <ThisOrThat />
    </main>
  );
}
