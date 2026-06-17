"use client";

import { useState, useTransition } from "react";
import { mintVoucherAction, toggleVoucherActiveAction, deleteVoucherAction } from "./actions";

type Voucher = { id: string; code: string; notes: string | null; token_amount: number; days_amount: number; max_redeem: number; redeem_count: number; expires_at: string | null; is_active: boolean; created_at: string };

export function VouchersPanel({ items }: { items: Voucher[] }) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-base font-bold text-ink">🎫 Voucher</h2>
      <p className="mb-3 text-xs text-ink/55">
        Terbitkan kode voucher buat dibagikan ke user. Voucher kasih kombinasi token + hari premium. <code className="bg-ink/5 px-1 rounded text-[10px]">max_redeem</code> = berapa user bisa pakai 1 kode. <code className="bg-ink/5 px-1 rounded text-[10px]">expires_at</code> bisa dikosongin (no expiry).
      </p>

      <NewVoucherForm />

      <ul className="mt-4 flex flex-col gap-2">
        {items.length === 0 && <p className="text-sm text-ink/40 text-center py-4">Belum ada voucher.</p>}
        {items.map((v) => <li key={v.id}><VoucherRow item={v} /></li>)}
      </ul>
    </section>
  );
}

function NewVoucherForm() {
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [daysAmount, setDaysAmount] = useState(0);
  const [maxRedeem, setMaxRedeem] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, start] = useTransition();

  function generate() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "SOUL-";
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setCode(s);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/30 p-3">
      <p className="text-xs font-semibold text-ink">+ Terbitkan voucher baru</p>
      <div className="flex flex-wrap gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode (mis. SOUL-A2B3C4)" className="flex-1 min-w-[140px] rounded-lg border border-sky-100 bg-white/80 px-2 py-1.5 text-xs uppercase" />
        <button type="button" onClick={generate} className="rounded-lg bg-white px-2 py-1 text-xs text-sky-600 ring-1 ring-sky-200">🎲 Acak</button>
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan internal (opsional, mis. Promo Launch / Reward Beta Tester)" className="rounded-lg border border-sky-100 bg-white/80 px-2 py-1.5 text-xs" />
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-ink/70">🪙 Token <input type="number" min={0} value={tokenAmount} onChange={(e) => setTokenAmount(+e.target.value)} className="w-16 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" /></label>
        <label className="flex items-center gap-1 text-xs text-ink/70">⏳ Hari <input type="number" min={0} value={daysAmount} onChange={(e) => setDaysAmount(+e.target.value)} className="w-16 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" /></label>
        <label className="flex items-center gap-1 text-xs text-ink/70">Max user <input type="number" min={1} value={maxRedeem} onChange={(e) => setMaxRedeem(+e.target.value)} className="w-14 rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" /></label>
        <label className="flex items-center gap-1 text-xs text-ink/70">Expires <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded border border-sky-100 bg-white/80 px-2 py-1 text-xs" /></label>
      </div>
      <button
        onClick={() => start(async () => {
          const r = await mintVoucherAction({
            code, notes, token_amount: tokenAmount, days_amount: daysAmount, max_redeem: maxRedeem,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          });
          if (r.error) alert(r.error);
          else { setCode(""); setNotes(""); setTokenAmount(0); setDaysAmount(0); setMaxRedeem(1); setExpiresAt(""); }
        })}
        disabled={pending}
        className="self-start rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "..." : "Terbitkan"}
      </button>
    </div>
  );
}

function VoucherRow({ item }: { item: Voucher }) {
  const [pending, start] = useTransition();
  const expired = item.expires_at && new Date(item.expires_at) < new Date();
  const full = item.redeem_count >= item.max_redeem;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/60 p-2 text-xs">
      <code className="rounded bg-sky-100 px-2 py-1 font-mono text-sky-800">{item.code}</code>
      <span className="text-ink/65">🪙 {item.token_amount}</span>
      <span className="text-ink/65">⏳ {item.days_amount}h</span>
      <span className={`text-ink/55 ${full ? "text-rose-600" : ""}`}>{item.redeem_count} / {item.max_redeem}</span>
      {expired && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">expired</span>}
      {!item.is_active && <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/55">nonaktif</span>}
      {item.notes && <span className="flex-1 min-w-[100px] italic text-ink/45 truncate">{item.notes}</span>}
      <button
        onClick={() => start(async () => { const r = await toggleVoucherActiveAction(item.id, !item.is_active); if (r.error) alert(r.error); })}
        disabled={pending}
        className="rounded bg-white px-2 py-0.5 text-[10px] text-ink/65 ring-1 ring-sky-100"
      >
        {item.is_active ? "Nonaktifkan" : "Aktifkan"}
      </button>
      <button
        onClick={() => start(async () => { if (confirm("Hapus voucher? (Riwayat redeem ikut kehapus)")) { const r = await deleteVoucherAction(item.id); if (r.error) alert(r.error); } })}
        className="text-[10px] text-rose-500"
      >
        Hapus
      </button>
    </div>
  );
}
