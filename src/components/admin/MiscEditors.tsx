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

// ==================== Daily Messages ("Pesan Hari Ini") ====================
import { saveDailyMessageAction, deleteDailyMessageAction } from "@/app/admin/games/actions";

export function DailyMessageEditor({ items }: { items: { id: string; body: string; sort_order: number; is_active: boolean }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">💌 Pesan Hari Ini</h2>
      <p className="mb-3 text-xs text-ink/55">Pesan singkat yang muncul di banner atas feed. Rotasi otomatis per hari (deterministik).</p>
      <ul className="mb-3 flex flex-col gap-2">
        {items.map((it) => <li key={it.id}><DailyMessageRow item={it} /></li>)}
      </ul>
      <DailyMessageRow item={{ id: "", body: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}

function DailyMessageRow({ item, isNew }: { item: { id: string; body: string; sort_order: number; is_active: boolean }; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-start gap-2 rounded-xl border border-sky-100 bg-white/60 p-2">
      <textarea value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} placeholder="Pesan singkat (mis. 'Pelan-pelan nggak apa-apa.')" rows={2} className="min-w-[240px] flex-1 rounded-lg border border-sky-100 bg-white/80 px-2 py-1.5 text-xs" />
      <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-16 rounded-lg border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <label className="flex items-center gap-1 pt-1.5 text-xs text-ink/70">
        <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />
        Aktif
      </label>
      <button onClick={() => start(async () => { const r = await saveDailyMessageAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...v, body: "" }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">
        {pending ? "..." : isNew ? "+ Tambah" : "Simpan"}
      </button>
      {!isNew && (
        <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteDailyMessageAction(item.id); })} className="text-xs text-rose-500">Hapus</button>
      )}
    </div>
  );
}

// ==================== Round-2 game editors ====================
import {
  saveMirrorProfileAction, deleteMirrorProfileAction,
  saveMirrorScenarioAction, deleteMirrorScenarioAction,
  saveDetectiveAction, deleteDetectiveAction,
  saveVoiceAction, deleteVoiceAction,
  saveBatteryAction, deleteBatteryAction,
  saveEmotionAction, deleteEmotionAction,
  saveTarotAction, deleteTarotAction,
  saveMonsterAction, deleteMonsterAction,
} from "@/app/admin/games/actions";

// ---------- Mirror Profiles ----------
type MirrorProfile = { id: string; slug: string; name: string; emoji: string; description: string; insight: string; sort_order: number; is_active: boolean };
export function MirrorProfileEditor({ items }: { items: MirrorProfile[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🪞 Pikiran Mirror — Profil</h2>
      <p className="mb-3 text-xs text-ink/55">Archetype profil hasil quiz Pikiran Mirror.</p>
      <ul className="mb-3 flex flex-col gap-2">
        {items.map((it) => <li key={it.id}><MirrorProfileRow item={it} /></li>)}
      </ul>
      <MirrorProfileRow item={{ id: "", slug: "", name: "", emoji: "✨", description: "", insight: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function MirrorProfileRow({ item, isNew }: { item: MirrorProfile; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        <input value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} className="w-12 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-center text-base" />
        <input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="slug" className="w-24 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama profil" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      </div>
      <textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Deskripsi singkat" rows={2} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <textarea value={v.insight} onChange={(e) => setV({ ...v, insight: e.target.value })} placeholder="Insight (kelebihan + tantangan + tip)" rows={2} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveMirrorProfileAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteMirrorProfileAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Mirror Scenarios ----------
type MOption = { text: string; profile_slug: string };
type MirrorScenario = { id: string; category: string; situation: string; options: MOption[]; sort_order: number; is_active: boolean };
export function MirrorScenarioEditor({ items, profiles }: { items: MirrorScenario[]; profiles: { slug: string; name: string }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🪞 Pikiran Mirror — Skenario</h2>
      <p className="mb-3 text-xs text-ink/55">Situasi + 4 opsi respons, masing-masing nge-link ke profil tertentu.</p>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><MirrorScenarioRow item={it} profiles={profiles} /></li>)}</ul>
      <MirrorScenarioRow item={{ id: "", category: "umum", situation: "", options: [{ text: "", profile_slug: profiles[0]?.slug ?? "" }], sort_order: items.length + 1, is_active: true }} profiles={profiles} isNew />
    </section>
  );
}
function MirrorScenarioRow({ item, profiles, isNew }: { item: MirrorScenario; profiles: { slug: string; name: string }[]; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <div className="flex flex-wrap gap-2">
        <input value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })} placeholder="kategori" className="w-32 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <textarea value={v.situation} onChange={(e) => setV({ ...v, situation: e.target.value })} placeholder="Situasi" rows={2} className="flex-1 min-w-[240px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      </div>
      <div className="flex flex-col gap-1.5 pl-2">
        {v.options.map((o, i) => (
          <div key={i} className="flex flex-wrap items-start gap-1.5 rounded-lg bg-sky-50/50 p-1.5">
            <span className="pt-1 text-xs text-ink/40">{i + 1}.</span>
            <input value={o.text} onChange={(e) => setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} placeholder="Teks opsi" className="flex-1 min-w-[180px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <select value={o.profile_slug} onChange={(e) => setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, profile_slug: e.target.value } : x) })} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs">
              {profiles.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
            <button onClick={() => setV({ ...v, options: v.options.filter((_, j) => j !== i) })} className="text-xs text-rose-500">✕</button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, options: [...v.options, { text: "", profile_slug: profiles[0]?.slug ?? "" }] })} type="button" className="self-start text-xs text-sky-600">+ Tambah opsi</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveMirrorScenarioAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus skenario?")) await deleteMirrorScenarioAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Detective ----------
type DOption = { slug: string; label: string; explanation: string };
type DCase = { id: string; content: string; correct: string; options: DOption[]; sort_order: number; is_active: boolean };
export function DetectiveEditor({ items }: { items: DCase[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🔍 Detektif Emosi</h2>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><DetectiveRow item={it} /></li>)}</ul>
      <DetectiveRow item={{ id: "", content: "", correct: "", options: [{ slug: "", label: "", explanation: "" }], sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function DetectiveRow({ item, isNew }: { item: DCase; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <textarea value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} placeholder='Chat / situasi (mis. &apos;"Gapapa kok, aku baik-baik aja."&apos;)' rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <input value={v.correct} onChange={(e) => setV({ ...v, correct: e.target.value })} placeholder="Slug emosi yang benar (mis. sedih)" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex flex-col gap-1.5 pl-2">
        {v.options.map((o, i) => (
          <div key={i} className="flex flex-wrap items-start gap-1.5 rounded-lg bg-sky-50/50 p-1.5">
            <input value={o.slug} onChange={(e) => setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, slug: e.target.value } : x) })} placeholder="slug" className="w-20 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <input value={o.label} onChange={(e) => setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="Label" className="w-28 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <input value={o.explanation} onChange={(e) => setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, explanation: e.target.value } : x) })} placeholder="Penjelasan" className="flex-1 min-w-[160px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <button onClick={() => setV({ ...v, options: v.options.filter((_, j) => j !== i) })} className="text-xs text-rose-500">✕</button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, options: [...v.options, { slug: "", label: "", explanation: "" }] })} type="button" className="self-start text-xs text-sky-600">+ Tambah opsi</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveDetectiveAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteDetectiveAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Voice (Inner Voices) ----------
type Voice = { id: string; situation: string; critic_text: string; supportive_text: string; outcome_critic: string; outcome_supportive: string; sort_order: number; is_active: boolean };
export function VoiceEditor({ items }: { items: Voice[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🗣️ Suara Dalam Kepala</h2>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><VoiceRow item={it} /></li>)}</ul>
      <VoiceRow item={{ id: "", situation: "", critic_text: "", supportive_text: "", outcome_critic: "", outcome_supportive: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function VoiceRow({ item, isNew }: { item: Voice; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <textarea value={v.situation} onChange={(e) => setV({ ...v, situation: e.target.value })} placeholder="Situasi pemicu" rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <textarea value={v.critic_text} onChange={(e) => setV({ ...v, critic_text: e.target.value })} placeholder="😠 Yang dikatakan suara kritis" rows={2} className="rounded border border-rose-200 bg-rose-50/40 px-2 py-1 text-xs" />
      <textarea value={v.outcome_critic} onChange={(e) => setV({ ...v, outcome_critic: e.target.value })} placeholder="Akibat kalau lo dengerin yang kritis" rows={2} className="rounded border border-rose-200 bg-rose-50/40 px-2 py-1 text-xs" />
      <textarea value={v.supportive_text} onChange={(e) => setV({ ...v, supportive_text: e.target.value })} placeholder="🌿 Yang dikatakan suara supportive" rows={2} className="rounded border border-emerald-200 bg-emerald-50/40 px-2 py-1 text-xs" />
      <textarea value={v.outcome_supportive} onChange={(e) => setV({ ...v, outcome_supportive: e.target.value })} placeholder="Akibat kalau lo dengerin yang supportive" rows={2} className="rounded border border-emerald-200 bg-emerald-50/40 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveVoiceAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteVoiceAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Battery ----------
type Battery = { id: string; emoji: string; label: string; description: string; social_delta: number; energy_delta: number; productivity_delta: number; sort_order: number; is_active: boolean };
export function BatteryEditor({ items }: { items: Battery[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🔋 Energi Sosial — Aktivitas</h2>
      <ul className="mb-3 flex flex-col gap-2">{items.map((it) => <li key={it.id}><BatteryRow item={it} /></li>)}</ul>
      <BatteryRow item={{ id: "", emoji: "✨", label: "", description: "", social_delta: 0, energy_delta: 0, productivity_delta: 0, sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function BatteryRow({ item, isNew }: { item: Battery; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} className="w-12 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-center text-base" />
      <input value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder="Label" className="w-32 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Deskripsi singkat" className="flex-1 min-w-[160px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <div className="flex gap-1">
        <label className="flex flex-col text-[10px] text-ink/55"><span>Sosial</span><input type="number" value={v.social_delta} onChange={(e) => setV({ ...v, social_delta: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/70 px-1 py-0.5 text-xs" /></label>
        <label className="flex flex-col text-[10px] text-ink/55"><span>Energi</span><input type="number" value={v.energy_delta} onChange={(e) => setV({ ...v, energy_delta: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/70 px-1 py-0.5 text-xs" /></label>
        <label className="flex flex-col text-[10px] text-ink/55"><span>Prod</span><input type="number" value={v.productivity_delta} onChange={(e) => setV({ ...v, productivity_delta: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/70 px-1 py-0.5 text-xs" /></label>
      </div>
      <button onClick={() => start(async () => { const r = await saveBatteryAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item, label: "", description: "" }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
      {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteBatteryAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
    </div>
  );
}

// ---------- Emotion ----------
type Emotion = { id: string; content: string; correct: string; options: string[]; sort_order: number; is_active: boolean };
export function EmotionEditor({ items }: { items: Emotion[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🎯 Tebak Emosi</h2>
      <ul className="mb-3 flex flex-col gap-2">{items.map((it) => <li key={it.id}><EmotionRow item={it} /></li>)}</ul>
      <EmotionRow item={{ id: "", content: "", correct: "", options: [], sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function EmotionRow({ item, isNew }: { item: Emotion; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [optsStr, setOptsStr] = useState(item.options.join(", "));
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <input value={v.content} onChange={(e) => setV({ ...v, content: e.target.value })} placeholder='Konten (mis. &apos;😅 "Gapapa kok"&apos;)' className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex flex-wrap gap-1.5">
        <input value={v.correct} onChange={(e) => setV({ ...v, correct: e.target.value })} placeholder="Jawaban benar" className="w-32 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <input value={optsStr} onChange={(e) => { setOptsStr(e.target.value); setV({ ...v, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }); }} placeholder="Opsi (pisah koma)" className="flex-1 min-w-[200px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveEmotionAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) { setV({ ...item }); setOptsStr(""); } })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteEmotionAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Tarot ----------
type Tarot = { id: string; name: string; emoji: string; meaning_situation: string; meaning_feeling: string; meaning_action: string; sort_order: number; is_active: boolean };
export function TarotEditor({ items }: { items: Tarot[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🎴 Tarot Refleksi</h2>
      <ul className="mb-3 flex flex-col gap-2">{items.map((it) => <li key={it.id}><TarotRow item={it} /></li>)}</ul>
      <TarotRow item={{ id: "", name: "", emoji: "🌙", meaning_situation: "", meaning_feeling: "", meaning_action: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function TarotRow({ item, isNew }: { item: Tarot; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        <input value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} className="w-12 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-center text-base" />
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama kartu" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      </div>
      <textarea value={v.meaning_situation} onChange={(e) => setV({ ...v, meaning_situation: e.target.value })} placeholder="Makna slot Situasi" rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <textarea value={v.meaning_feeling} onChange={(e) => setV({ ...v, meaning_feeling: e.target.value })} placeholder="Makna slot Perasaan" rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <textarea value={v.meaning_action} onChange={(e) => setV({ ...v, meaning_action: e.target.value })} placeholder="Makna slot Aksi" rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveTarotAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteTarotAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ---------- Monster ----------
type MonsterResp = { text: string; effect: "grow" | "shrink" | "stay"; insight: string };
type Monster = { id: string; situation: string; responses: MonsterResp[]; sort_order: number; is_active: boolean };
export function MonsterEditor({ items }: { items: Monster[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">👹 Monster Cemas</h2>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><MonsterRow item={it} /></li>)}</ul>
      <MonsterRow item={{ id: "", situation: "", responses: [{ text: "", effect: "stay", insight: "" }], sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function MonsterRow({ item, isNew }: { item: Monster; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <textarea value={v.situation} onChange={(e) => setV({ ...v, situation: e.target.value })} placeholder='Yang dikatakan monster (mis. "Mereka pasti benci kamu")' rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex flex-col gap-1.5 pl-2">
        {v.responses.map((r, i) => (
          <div key={i} className="flex flex-wrap items-start gap-1.5 rounded-lg bg-sky-50/50 p-1.5">
            <input value={r.text} onChange={(e) => setV({ ...v, responses: v.responses.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} placeholder="Respons user" className="flex-1 min-w-[180px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <select value={r.effect} onChange={(e) => setV({ ...v, responses: v.responses.map((x, j) => j === i ? { ...x, effect: e.target.value as "grow" | "shrink" | "stay" } : x) })} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs">
              <option value="grow">🔺 grow</option>
              <option value="stay">➡ stay</option>
              <option value="shrink">🔻 shrink</option>
            </select>
            <input value={r.insight} onChange={(e) => setV({ ...v, responses: v.responses.map((x, j) => j === i ? { ...x, insight: e.target.value } : x) })} placeholder="Insight" className="flex-1 min-w-[180px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <button onClick={() => setV({ ...v, responses: v.responses.filter((_, j) => j !== i) })} className="text-xs text-rose-500">✕</button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, responses: [...v.responses, { text: "", effect: "stay", insight: "" }] })} type="button" className="self-start text-xs text-sky-600">+ Tambah respons</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveMonsterAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteMonsterAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ==================== Spektrum Sosial editors ====================
import {
  savePersonalityCategoryAction, deletePersonalityCategoryAction,
  savePersonalityQuestionAction, deletePersonalityQuestionAction,
  saveCompassTypeAction,
  saveCompassQuestionAction, deleteCompassQuestionAction,
  saveCompassMajorAction, deleteCompassMajorAction,
} from "@/app/admin/games/actions";

type PCat = { id: string; slug: string; name: string; emoji: string; description: string; sort_order: number; is_active: boolean };
export function PersonalityCategoryEditor({ items }: { items: PCat[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🌗 Spektrum Sosial — Kategori</h2>
      <p className="mb-3 text-xs text-ink/55">6 kategori dimensi extraversion (Big Five). Tambahin kalau mau gali lebih dalam.</p>
      <ul className="mb-3 flex flex-col gap-2">{items.map((it) => <li key={it.id}><PCatRow item={it} /></li>)}</ul>
      <PCatRow item={{ id: "", slug: "", name: "", emoji: "✨", description: "", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function PCatRow({ item, isNew }: { item: PCat; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        <input value={v.emoji} onChange={(e) => setV({ ...v, emoji: e.target.value })} className="w-12 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-center text-base" />
        <input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="slug" className="w-24 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama kategori" className="flex-1 min-w-[120px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      </div>
      <textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Deskripsi singkat kategori" rows={2} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await savePersonalityCategoryAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus kategori? (Semua pertanyaan di kategori ini ikut terhapus)")) await deletePersonalityCategoryAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

type POpt = { text: string; intro_weight: number; extro_weight: number };
type PQ = { id: string; category_id: string; text: string; options: POpt[]; sort_order: number; is_active: boolean };
export function PersonalityQuestionEditor({ items, categories }: { items: PQ[]; categories: { id: string; name: string }[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🌗 Spektrum Sosial — Pertanyaan</h2>
      <p className="mb-3 text-xs text-ink/55">Per pertanyaan: 4 opsi dengan bobot intro/extro masing-masing (mis. opsi paling introvert = 2/0).</p>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><PQRow item={it} categories={categories} /></li>)}</ul>
      <PQRow item={{ id: "", category_id: categories[0]?.id ?? "", text: "", options: [{ text: "", intro_weight: 2, extro_weight: 0 }, { text: "", intro_weight: 1, extro_weight: 0 }, { text: "", intro_weight: 0, extro_weight: 1 }, { text: "", intro_weight: 0, extro_weight: 2 }], sort_order: items.length + 1, is_active: true }} categories={categories} isNew />
    </section>
  );
}
function PQRow({ item, categories, isNew }: { item: PQ; categories: { id: string; name: string }[]; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  function updOpt(i: number, patch: Partial<POpt>) { setV({ ...v, options: v.options.map((x, j) => j === i ? { ...x, ...patch } : x) }); }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <div className="flex flex-wrap gap-2">
        <select value={v.category_id} onChange={(e) => setV({ ...v, category_id: e.target.value })} className="w-40 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} placeholder="Pertanyaan" rows={2} className="flex-1 min-w-[220px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      </div>
      <div className="flex flex-col gap-1.5 pl-2">
        {v.options.map((o, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-sky-50/50 p-1.5">
            <span className="text-xs text-ink/40">{i + 1}.</span>
            <input value={o.text} onChange={(e) => updOpt(i, { text: e.target.value })} placeholder="Teks opsi" className="flex-1 min-w-[160px] rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
            <label className="flex items-center gap-1 text-[10px] text-ink/55"><span>🌙</span><input type="number" min={0} max={3} value={o.intro_weight} onChange={(e) => updOpt(i, { intro_weight: +e.target.value })} className="w-12 rounded border border-sky-100 bg-white/80 px-1 py-0.5 text-xs" /></label>
            <label className="flex items-center gap-1 text-[10px] text-ink/55"><span>🌞</span><input type="number" min={0} max={3} value={o.extro_weight} onChange={(e) => updOpt(i, { extro_weight: +e.target.value })} className="w-12 rounded border border-sky-100 bg-white/80 px-1 py-0.5 text-xs" /></label>
            <button onClick={() => setV({ ...v, options: v.options.filter((_, j) => j !== i) })} className="text-xs text-rose-500">✕</button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, options: [...v.options, { text: "", intro_weight: 0, extro_weight: 0 }] })} type="button" className="self-start text-xs text-sky-600">+ Tambah opsi</button>
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await savePersonalityQuestionAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deletePersonalityQuestionAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}

// ==================== Kompas Jurusan editors ====================

type CType = { letter: string; name: string; tagline: string; description: string; traits: string; sort_order: number; is_active: boolean };
export function CompassTypeEditor({ items }: { items: CType[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🧭 Kompas Jurusan — Tipe RIASEC</h2>
      <p className="mb-3 text-xs text-ink/55">6 tipe (R/I/A/S/E/C). Edit deskripsi yang muncul di hasil quiz.</p>
      <ul className="flex flex-col gap-2">{items.map((it) => <li key={it.letter}><CTypeRow item={it} /></li>)}</ul>
    </section>
  );
}
function CTypeRow({ item }: { item: CType }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-lg bg-sky-500 px-3 py-1 text-sm font-bold text-white">{v.letter}</span>
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama" className="w-32 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <input value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} placeholder="Tagline" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      </div>
      <textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Deskripsi tipe" rows={2} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input value={v.traits} onChange={(e) => setV({ ...v, traits: e.target.value })} placeholder="Traits (pisah · )" className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveCompassTypeAction({ ...v, letter: v.letter as "R"|"I"|"A"|"S"|"E"|"C" }); if (r.error) alert(r.error); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : "Simpan"}</button>
      </div>
    </div>
  );
}

type CQ = { id: string; text: string; letter: string; sort_order: number; is_active: boolean };
export function CompassQuestionEditor({ items }: { items: CQ[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🧭 Kompas Jurusan — Pertanyaan</h2>
      <p className="mb-3 text-xs text-ink/55">Per pertanyaan dipasang ke 1 letter RIASEC. User jawab Likert 1-5.</p>
      <ul className="mb-3 flex flex-col gap-2">{items.map((it) => <li key={it.id}><CQRow item={it} /></li>)}</ul>
      <CQRow item={{ id: "", text: "", letter: "R", sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function CQRow({ item, isNew }: { item: CQ; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-sky-100 bg-white/60 p-2">
      <select value={v.letter} onChange={(e) => setV({ ...v, letter: e.target.value })} className="rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs font-bold">
        <option value="R">R</option><option value="I">I</option><option value="A">A</option><option value="S">S</option><option value="E">E</option><option value="C">C</option>
      </select>
      <input value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} placeholder="Pertanyaan" className="flex-1 min-w-[240px] rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded-lg border border-sky-100 bg-white/70 px-2 py-1 text-xs" />
      <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
      <button onClick={() => start(async () => { const r = await saveCompassQuestionAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) setV({ ...item }); })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah" : "Simpan"}</button>
      {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteCompassQuestionAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
    </div>
  );
}

type CM = { id: string; name: string; description: string; primary_letters: string[]; careers: string[]; sort_order: number; is_active: boolean };
export function CompassMajorEditor({ items }: { items: CM[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🧭 Kompas Jurusan — Daftar Jurusan</h2>
      <p className="mb-3 text-xs text-ink/55">Tiap jurusan dipasangin 1-4 letter RIASEC + list karir. Toggle letter dengan klik tombol.</p>
      <ul className="mb-3 flex flex-col gap-3">{items.map((it) => <li key={it.id}><CMRow item={it} /></li>)}</ul>
      <CMRow item={{ id: "", name: "", description: "", primary_letters: [], careers: [], sort_order: items.length + 1, is_active: true }} isNew />
    </section>
  );
}
function CMRow({ item, isNew }: { item: CM; isNew?: boolean }) {
  const [v, setV] = useState(item);
  const [careersStr, setCareersStr] = useState(item.careers.join(", "));
  const [pending, start] = useTransition();
  const LETTERS = ["R","I","A","S","E","C"];
  function toggleLetter(l: string) {
    setV({ ...v, primary_letters: v.primary_letters.includes(l) ? v.primary_letters.filter((x) => x !== l) : [...v.primary_letters, l] });
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-white/60 p-3">
      <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Nama jurusan" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs font-semibold" />
      <textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="Deskripsi jurusan singkat" rows={2} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-ink/55">Letter RIASEC:</span>
        {LETTERS.map((l) => (
          <button key={l} type="button" onClick={() => toggleLetter(l)} className={`rounded px-2 py-1 text-xs font-bold ${v.primary_letters.includes(l) ? "bg-sky-500 text-white" : "bg-white text-ink/55 ring-1 ring-sky-100"}`}>
            {l}
          </button>
        ))}
        <span className="text-[10px] text-ink/40">(urutan = prioritas, klik buat toggle)</span>
      </div>
      <input value={careersStr} onChange={(e) => { setCareersStr(e.target.value); setV({ ...v, careers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }); }} placeholder="Karir (pisah koma, mis. Dokter, Peneliti, Konsultan)" className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70"><input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} />Aktif</label>
        <input type="number" value={v.sort_order} onChange={(e) => setV({ ...v, sort_order: +e.target.value })} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" />
        <button onClick={() => start(async () => { const r = await saveCompassMajorAction({ ...v, id: isNew ? undefined : v.id }); if (r.error) alert(r.error); else if (isNew) { setV({ ...item }); setCareersStr(""); } })} disabled={pending} className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{pending ? "..." : isNew ? "+ Tambah jurusan" : "Simpan"}</button>
        {!isNew && <button onClick={() => start(async () => { if (confirm("Hapus?")) await deleteCompassMajorAction(item.id); })} className="text-xs text-rose-500">Hapus</button>}
      </div>
    </div>
  );
}
