"use client";

import { useState, useTransition } from "react";
import {
  saveTotAction, deleteTotAction,
  saveDcAction, deleteDcAction,
  saveQuestPromptAction,
  saveVibeAction, deleteVibeAction,
} from "@/app/admin/games/actions";

type Tot = { id: string; prompt_a: string; prompt_b: string };
type Dc = { id: string; body: string };
type Qp = { day: number; prompt: string };
type Vp = { id: string; emoji: string; label: string; href: string };

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {hint && <p className="text-xs text-ink/55">{hint}</p>}
      {children}
    </section>
  );
}

export function TotEditor({ items }: { items: Tot[] }) {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [pending, st] = useTransition();
  return (
    <Section title="Ini atau Itu" hint="Pasangan pilihan buat check-in cepat.">
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <div key={it.id} className="glass flex items-center justify-between gap-2 rounded-xl p-2 text-xs">
            <span className="text-ink/70">{it.prompt_a} <span className="text-ink/30">vs</span> {it.prompt_b}</span>
            <button type="button" disabled={pending} onClick={() => st(() => { void deleteTotAction(it.id); })} className="text-red-500">Hapus</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={a} onChange={(e) => setA(e.target.value)} placeholder="sisi A" className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={b} onChange={(e) => setB(e.target.value)} placeholder="sisi B" className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button type="button" disabled={pending} onClick={() => st(async () => { const r = await saveTotAction(null, a, b); if (!r.error) { setA(""); setB(""); } })} className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">+ Tambah</button>
      </div>
    </Section>
  );
}

export function DcEditor({ items }: { items: Dc[] }) {
  const [body, setBody] = useState("");
  const [pending, st] = useTransition();
  return (
    <Section title="Tantangan Empati Harian" hint="Rotasi otomatis berdasarkan tanggal.">
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <div key={it.id} className="glass flex items-center justify-between gap-2 rounded-xl p-2 text-xs">
            <span className="text-ink/70">{it.body}</span>
            <button type="button" disabled={pending} onClick={() => st(() => { void deleteDcAction(it.id); })} className="text-red-500">Hapus</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="tantangan baru" className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button type="button" disabled={pending} onClick={() => st(async () => { const r = await saveDcAction(null, body); if (!r.error) setBody(""); })} className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">+ Tambah</button>
      </div>
    </Section>
  );
}

export function QuestPromptsEditor({ items }: { items: Qp[] }) {
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const o: Record<number, string> = {};
    for (let d = 1; d <= 7; d++) o[d] = items.find((x) => x.day === d)?.prompt ?? "";
    return o;
  });
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [, st] = useTransition();
  return (
    <Section title="7 Hari Kenal Diri (prompt)" hint="Edit prompt tiap hari.">
      {Array.from({ length: 7 }, (_, i) => i + 1).map((d) => (
        <div key={d} className="flex gap-1">
          <span className="w-12 shrink-0 self-center text-xs font-medium text-ink/55">Hari {d}</span>
          <input value={drafts[d] ?? ""} onChange={(e) => setDrafts({ ...drafts, [d]: e.target.value })} className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
          <button type="button" disabled={savingDay === d}
            onClick={() => { setSavingDay(d); st(async () => { await saveQuestPromptAction(d, drafts[d] ?? ""); setSavingDay(null); }); }}
            className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">{savingDay === d ? "..." : "Simpan"}</button>
        </div>
      ))}
    </Section>
  );
}

export function VibeEditor({ items }: { items: Vp[] }) {
  const [emoji, setEmoji] = useState(""); const [label, setLabel] = useState(""); const [href, setHref] = useState("");
  const [pending, st] = useTransition();
  return (
    <Section title='Vibe Chooser ("Lagi pengen apa?")' hint="Link cepat ke filter/halaman lain.">
      <div className="flex flex-col gap-1">
        {items.map((it) => (
          <div key={it.id} className="glass flex items-center justify-between gap-2 rounded-xl p-2 text-xs">
            <span className="text-ink/70">{it.emoji} {it.label} <span className="text-ink/30">→ {it.href}</span></span>
            <button type="button" disabled={pending} onClick={() => st(() => { void deleteVibeAction(it.id); })} className="text-red-500">Hapus</button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="emoji" className="w-16 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="label" className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/feed?status=..." className="flex-1 rounded border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button type="button" disabled={pending} onClick={() => st(async () => { const r = await saveVibeAction(null, emoji, label, href); if (!r.error) { setEmoji(""); setLabel(""); setHref(""); } })} className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white">+ Tambah</button>
      </div>
    </Section>
  );
}
