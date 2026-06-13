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

// ==================== 4 NEW interactive games editors ====================

import {
  saveBreathingAction, deleteBreathingAction,
  saveMoodColorAction, deleteMoodColorAction,
  saveGroundingAction, deleteGroundingAction,
  saveCbtScenarioAction, deleteCbtScenarioAction,
} from "@/app/admin/games/actions";

export function BreathingEditor({ items }: { items: { id: string; slug: string; label: string; in_seconds: number; hold_seconds: number; out_seconds: number; sort_order: number; is_active: boolean }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🫧 Protokol Napas</h2>
      <p className="mb-3 text-xs text-ink/55">Pola napas buat /main/napas (in / hold / out detik).</p>
      <ul className="mb-3 flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.id}>
            <BreathRow item={it} />
          </li>
        ))}
      </ul>
      <BreathRow item={{ id: "", slug: "", label: "", in_seconds: 4, hold_seconds: 7, out_seconds: 8, sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}

function BreathRow({ item, isNew }: { item: { id: string; slug: string; label: string; in_seconds: number; hold_seconds: number; out_seconds: number; sort_order: number; is_active: boolean }; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="slug" className="w-20 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder="Label" className="min-w-[120px] flex-1 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input type="number" min={1} value={v.in_seconds} onChange={(e) => setV({ ...v, in_seconds: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input type="number" min={0} value={v.hold_seconds} onChange={(e) => setV({ ...v, hold_seconds: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input type="number" min={1} value={v.out_seconds} onChange={(e) => setV({ ...v, out_seconds: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <button onClick={() => start(async () => { await saveBreathingAction({ ...v, id: isNew ? undefined : v.id }); if (isNew) setV({ ...v, slug: "", label: "" }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "..." : isNew ? "+ Tambah" : "Simpan"}
      </button>
      {!isNew && (
        <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteBreathingAction(item.id); })} className="text-xs text-rose-500">Hapus</button>
      )}
    </div>
  );
}

export function MoodColorEditor({ items }: { items: { id: string; hex: string; label: string; note: string; sort_order: number; is_active: boolean }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🎨 Warna Mood</h2>
      <p className="mb-3 text-xs text-ink/55">Palet warna + label perasaan buat /main/warna.</p>
      <ul className="mb-3 flex flex-col gap-2">
        {items.map((it) => <li key={it.id}><MoodColorRow item={it} /></li>)}
      </ul>
      <MoodColorRow item={{ id: "", hex: "#60a5fa", label: "", note: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}

function MoodColorRow({ item, isNew }: { item: { id: string; hex: string; label: string; note: string; sort_order: number; is_active: boolean }; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input type="color" value={v.hex} onChange={(e) => setV({ ...v, hex: e.target.value })} className="h-8 w-10 cursor-pointer rounded" />
      <input value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder="Label" className="w-24 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="Catatan" className="min-w-[180px] flex-1 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <button onClick={() => start(async () => { await saveMoodColorAction({ ...v, id: isNew ? undefined : v.id }); if (isNew) setV({ ...v, label: "", note: "" }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "..." : isNew ? "+ Tambah" : "Simpan"}
      </button>
      {!isNew && (
        <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteMoodColorAction(item.id); })} className="text-xs text-rose-500">Hapus</button>
      )}
    </div>
  );
}

export function GroundingEditor({ items }: { items: { id: string; count: number; sense: string; instr: string; emoji: string; sort_order: number; is_active: boolean }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🧭 Langkah Grounding</h2>
      <p className="mb-3 text-xs text-ink/55">Step-by-step buat /main/grounding (5-4-3-2-1 default).</p>
      <ul className="mb-3 flex flex-col gap-2">
        {items.map((it) => <li key={it.id}><GroundingRow item={it} /></li>)}
      </ul>
      <GroundingRow item={{ id: "", count: 5, sense: "", instr: "", emoji: "👁", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}

function GroundingRow({ item, isNew }: { item: { id: string; count: number; sense: string; instr: string; emoji: string; sort_order: number; is_active: boolean }; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} className="w-12 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-center text-base" />
      <input type="number" min={1} value={v.count} onChange={(e) => setV({ ...v, count: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.sense} onChange={(e) => setV({ ...v, sense: e.target.value })} placeholder="sense (lihat/dengar)" className="w-28 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.instr} onChange={(e) => setV({ ...v, instr: e.target.value })} placeholder="Instruksi" className="min-w-[200px] flex-1 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <button onClick={() => start(async () => { await saveGroundingAction({ ...v, id: isNew ? undefined : v.id }); if (isNew) setV({ ...v, sense: "", instr: "" }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "..." : isNew ? "+ Tambah" : "Simpan"}
      </button>
      {!isNew && (
        <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteGroundingAction(item.id); })} className="text-xs text-rose-500">Hapus</button>
      )}
    </div>
  );
}

type CbtThought = { text: string; correct: "distorsi" | "netral" | "sehat"; insight: string; distortion_type?: string | null };

export function CbtScenarioEditor({ items }: { items: { id: string; context: string; thoughts: CbtThought[]; sort_order: number; is_active: boolean }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🌀 Skenario CBT (Tantang Pikiran)</h2>
      <p className="mb-3 text-xs text-ink/55">Skenario + thoughts buat /main/tantang. Setiap pikiran punya kategori, insight, dan opsional jenis distorsi.</p>
      <ul className="mb-3 flex flex-col gap-3">
        {items.map((it) => <li key={it.id}><CbtScenarioRow item={it} /></li>)}
      </ul>
      <CbtScenarioRow item={{ id: "", context: "", thoughts: [{ text: "", correct: "distorsi", insight: "", distortion_type: "" }], sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}

function CbtScenarioRow({ item, isNew }: { item: { id: string; context: string; thoughts: CbtThought[]; sort_order: number; is_active: boolean }; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();

  function updateThought(i: number, patch: Partial<CbtThought>) {
    setV({ ...v, thoughts: v.thoughts.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  }
  function addThought() {
    setV({ ...v, thoughts: [...v.thoughts, { text: "", correct: "distorsi", insight: "", distortion_type: "" }] });
  }
  function removeThought(i: number) {
    setV({ ...v, thoughts: v.thoughts.filter((_, j) => j !== i) });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <textarea value={v.context} onChange={(e) => setV({ ...v, context: e.target.value })} placeholder="Skenario (contoh: 'Kamu lihat temen story bareng orang lain...')" rows={2} className="w-full rounded-lg border border-sky-100 bg-white/80 px-2 py-1.5 text-xs" />
      <div className="flex flex-col gap-2 pl-2">
        {v.thoughts.map((t, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2 rounded-lg bg-sky-50/50 p-2">
            <span className="pt-1 text-xs text-ink/40">{i + 1}.</span>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <input value={t.text} onChange={(e) => updateThought(i, { text: e.target.value })} placeholder="Pikiran (mis. 'Mereka pasti benci aku')" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
              <input value={t.insight} onChange={(e) => updateThought(i, { insight: e.target.value })} placeholder="Insight (penjelasan kenapa kategori ini)" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
              <input value={t.distortion_type ?? ""} onChange={(e) => updateThought(i, { distortion_type: e.target.value })} placeholder="Jenis distorsi (opsional, mis. 'Mind Reading')" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            </div>
            <select value={t.correct} onChange={(e) => updateThought(i, { correct: e.target.value as CbtThought["correct"] })} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs">
              <option value="distorsi">🔴 Distorsi</option>
              <option value="netral">🟡 Netral</option>
              <option value="sehat">🟢 Sehat</option>
            </select>
            <button onClick={() => removeThought(i)} className="text-xs text-rose-500">✕</button>
          </div>
        ))}
        <button onClick={addThought} type="button" className="self-start text-xs text-sky-600">+ Tambah pikiran</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70">
          <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />
          Aktif
        </label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-16 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveCbtScenarioAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
          {pending ? "..." : isNew ? "+ Tambah skenario" : "Simpan"}
        </button>
        {!isNew && (
          <button onClick={() => start(async () => { if (confirm("Hapus skenario?")) await deleteCbtScenarioAction(item.id); })} className="text-xs text-rose-500">Hapus</button>
        )}
      </div>
    </div>
  );
}
