"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCrisisMessageAction, deleteCrisisMessageAction } from "@/app/admin/games/crisis-mode/actions";

type Msg = {
  id: string;
  slot: string;
  text: string;
  sort_order: number;
  is_active: boolean;
};

const SLOT_INFO: Record<string, { label: string; emoji: string; desc: string; isMulti: boolean }> = {
  phase_opening: { label: "Phase 1 — Opening (somatic anchor)", emoji: "💙", desc: "Text awal 30 detik. Tone: gentle, validating, no advice.", isMulti: false },
  phase_means_check: { label: "Phase 2 — Means Check question", emoji: "🌿", desc: "Pertanyaan amankan diri. Single Y/N question.", isMulti: false },
  phase_means_restrict: { label: "Phase 3 — Means Restrict instruction", emoji: "🔒", desc: "Instruksi pindahin benda berbahaya. Calm, supportive.", isMulti: false },
  phase_connection_intro: { label: "Phase 4 — Connection intro", emoji: "📞", desc: "Kata pembuka sebelum nge-list contacts.", isMulti: false },
  phase_done_encouragement: { label: "Phase 6 — Done encouragement", emoji: "🌅", desc: "Pesan encouragement setelah crisis lewat.", isMulti: false },
  companion_gentle: { label: "Phase 5 — Companion gentle messages (rotate 40s)", emoji: "💙", desc: "Pesan yang rotate setiap 40 detik di companion mode. Bisa banyak, makin banyak makin variety.", isMulti: true },
};

export function CrisisMessagesEditor({ items }: { items: Msg[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Msg | null>(null);
  const [adding, setAdding] = useState<string | null>(null); // slot
  const [msg, setMsg] = useState<string | null>(null);

  const grouped: Record<string, Msg[]> = {};
  items.forEach(it => {
    (grouped[it.slot] ??= []).push(it);
  });

  const onSave = (data: Parameters<typeof saveCrisisMessageAction>[0]) => {
    startTransition(async () => {
      const r = await saveCrisisMessageAction(data);
      if (r.error) setMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Tersimpan");
        setEditing(null);
        setAdding(null);
        router.refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  const onDelete = (id: string, preview: string) => {
    if (!confirm(`Hapus message: "${preview.slice(0, 50)}..."?`)) return;
    startTransition(async () => {
      const r = await deleteCrisisMessageAction(id);
      if (r.error) setMsg("⚠️ " + r.error);
      else { setMsg("✓ Dihapus"); router.refresh(); setTimeout(() => setMsg(null), 2000); }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm ${msg.startsWith("⚠️") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"} ring-1 ring-current/20`}>
          {msg}
        </div>
      )}

      {Object.entries(SLOT_INFO).map(([slot, info]) => {
        const slotItems = grouped[slot] ?? [];
        return (
          <section key={slot} className="rounded-2xl bg-white ring-1 ring-ink/10 p-4">
            <header className="flex items-start justify-between gap-3 pb-3 border-b border-ink/5">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="text-xl">{info.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-ink">{info.label}</p>
                  <p className="text-xs text-ink/55 leading-relaxed">{info.desc}</p>
                </div>
              </div>
              {info.isMulti && (
                <button onClick={() => setAdding(slot)} className="shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white">+ Tambah</button>
              )}
            </header>

            {adding === slot && (
              <div className="mt-3">
                <MsgForm slot={slot} item={null} onSave={onSave} onCancel={() => setAdding(null)} isPending={isPending} />
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {slotItems.length === 0 ? (
                <p className="text-xs italic text-ink/40">Belum ada. {info.isMulti ? "Tap '+ Tambah' di atas." : "Reset ke default kalo dihapus."}</p>
              ) : slotItems.map((item) => (
                editing?.id === item.id ? (
                  <MsgForm key={item.id} slot={slot} item={item} onSave={onSave} onCancel={() => setEditing(null)} isPending={isPending} />
                ) : (
                  <div key={item.id} className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed text-ink/85 whitespace-pre-wrap">{item.text}</p>
                        {info.isMulti && <p className="mt-1 text-[10px] text-ink/40">order: {item.sort_order} {!item.is_active && " · ⚠️ inactive"}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button onClick={() => setEditing(item)} className="rounded bg-white px-2 py-0.5 text-[10px] text-sky-700 ring-1 ring-sky-200">✏️</button>
                        {info.isMulti && (
                          <button onClick={() => onDelete(item.id, item.text)} disabled={isPending} className="rounded bg-white px-2 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200">🗑️</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MsgForm({ slot, item, onSave, onCancel, isPending }: {
  slot: string;
  item: Msg | null;
  onSave: (data: Parameters<typeof saveCrisisMessageAction>[0]) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [text, setText] = useState(item?.text ?? "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order ?? 99);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  const submit = () => onSave({ id: item?.id, slot, text, sort_order: sortOrder, is_active: isActive });

  return (
    <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200 flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Text yang akan ditampilkan + dibacakan TTS..."
        className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm leading-relaxed"
      />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 text-xs text-ink/70">
          Order: <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="w-16 rounded border border-ink/15 px-2 py-1 text-xs" />
        </label>
        <label className="flex items-center gap-1 text-xs text-ink/70">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={isPending} className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {isPending ? "Saving..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2 text-xs font-medium text-ink/70 ring-1 ring-ink/15">Cancel</button>
      </div>
    </div>
  );
}
