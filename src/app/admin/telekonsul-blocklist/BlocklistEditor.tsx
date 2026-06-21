"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBlocklistAction, toggleBlocklistAction, deleteBlocklistAction } from "./actions";

type Entry = {
  id: string;
  pattern: string;
  match_type: "keyword" | "contains" | "regex";
  label: string | null;
  category: string | null;
  is_active: boolean;
};

const MATCH_LABELS: Record<string, string> = {
  keyword: "Kata (word)",
  contains: "Mengandung",
  regex: "Regex",
};

export function BlocklistEditor({ items }: { items: Entry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [pattern, setPattern] = useState("");
  const [matchType, setMatchType] = useState<"keyword" | "contains" | "regex">("keyword");
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("platform");

  const add = () => {
    if (!pattern.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await addBlocklistAction({ pattern, match_type: matchType, label, category });
      if (r.error) { setError(r.error); return; }
      setPattern(""); setLabel("");
      router.refresh();
    });
  };

  const toggle = (id: string, cur: boolean) => {
    startTransition(async () => {
      await toggleBlocklistAction(id, !cur);
      router.refresh();
    });
  };

  const del = (id: string) => {
    startTransition(async () => {
      await deleteBlocklistAction(id);
      router.refresh();
    });
  };

  // Group by category
  const grouped = items.reduce((acc, it) => {
    const c = it.category ?? "other";
    (acc[c] ??= []).push(it);
    return acc;
  }, {} as Record<string, Entry[]>);

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
        <p className="text-sm font-bold text-ink">Tambah kata/pola terlarang</p>
        <p className="mt-0.5 text-[11px] text-ink/60">
          Kata yang ke-detect bakal blokir pengiriman pesan. Hardcode bawaan tetap jalan walau ini kosong.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="cth: telegram, gmaps, atau pola regex"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as "keyword" | "contains" | "regex")}
              className="flex-1 rounded-lg border border-ink/15 px-2 py-2 text-sm"
            >
              <option value="keyword">Kata (word) — paling aman</option>
              <option value="contains">Mengandung (substring)</option>
              <option value="regex">Regex (advanced)</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-lg border border-ink/15 px-2 py-2 text-sm"
            >
              <option value="platform">Platform</option>
              <option value="phone">No HP</option>
              <option value="email">Email</option>
              <option value="address">Alamat/Maps</option>
              <option value="escape">Ajakan keluar</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (opsional, cth: Instagram)"
            className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !pattern.trim()}
            className="rounded-lg bg-sky-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "..." : "+ Tambah"}
          </button>
          {error && <p className="text-xs text-rose-700">⚠️ {error}</p>}
        </div>
      </div>

      {/* List grouped */}
      {Object.entries(grouped).map(([cat, entries]) => (
        <div key={cat}>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/50">
            {cat} ({entries.length})
          </p>
          <ul className="flex flex-col gap-1">
            {entries.map((it) => (
              <li
                key={it.id}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${
                  it.is_active ? "bg-white ring-ink/10" : "bg-ink/5 ring-ink/5 opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-mono font-medium text-ink">{it.pattern}</span>
                  {it.label && <span className="ml-2 text-[11px] text-ink/50">{it.label}</span>}
                  <span className="ml-2 rounded bg-ink/5 px-1.5 py-0.5 text-[10px] text-ink/55">
                    {MATCH_LABELS[it.match_type]}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(it.id, it.is_active)}
                  className="text-[11px] text-ink/50 hover:text-ink/80"
                >
                  {it.is_active ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  type="button"
                  onClick={() => del(it.id)}
                  className="text-[11px] text-rose-600 hover:text-rose-800"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
