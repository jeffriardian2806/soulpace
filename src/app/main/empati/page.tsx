import Link from "next/link";
import { EmpathyGame } from "@/components/EmpathyGame";

export const metadata = { title: "Pilih Respons Terbaik — Soulpace" };

export default function EmpatiPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center gap-3">
        <Link href="/main" className="text-sm text-ink/50">← Main</Link>
        <h1 className="text-lg font-bold text-ink">💙 Pilih Respons Terbaik</h1>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Latihan bales curhat orang dengan cara yang aman & nggak menghakimi.
      </p>
      <EmpathyGame />
    </main>
  );
}
