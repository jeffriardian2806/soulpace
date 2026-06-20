"use client";

import { useState, useTransition } from "react";
import { createConsultationSession } from "@/app/konsultasi/actions";

const MIN_LEN = 20;
const MAX_LEN = 2000;

export function KeluhanForm({ categorySlug, categoryName }: { categorySlug: string; categoryName: string }) {
  const [text, setText] = useState("");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const remaining = MAX_LEN - text.length;
  const isValid = text.trim().length >= MIN_LEN && text.trim().length <= MAX_LEN;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!isValid) {
      setErr(`Minimal ${MIN_LEN} karakter, maksimal ${MAX_LEN}.`);
      return;
    }
    const fd = new FormData();
    fd.append("category_slug", categorySlug);
    fd.append("keluhan_text", text);
    if (shareToFeed) fd.append("share_to_feed", "on");
    startTransition(async () => {
      const result = await createConsultationSession(fd);
      if (result?.error) setErr(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
        <label className="block text-xs font-semibold text-ink/65">
          Apa yang lagi terjadi di {categoryName.toLowerCase()}?
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
          rows={6}
          placeholder="Ceritain pelan-pelan. Apa kejadiannya, sejak kapan, sama siapa, gimana lo ngerasanya. Detail lebih bagus."
          className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm leading-relaxed text-ink focus:border-sky-400 focus:outline-none"
          required
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-ink/45">
          <span>{text.trim().length < MIN_LEN ? `Min ${MIN_LEN} karakter (${text.trim().length}/${MIN_LEN})` : "✓ Cukup detail"}</span>
          <span>{remaining} char tersisa</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50/60 p-3 ring-1 ring-amber-100">
        <input
          type="checkbox"
          checked={shareToFeed}
          onChange={(e) => setShareToFeed(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-sky-500"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-ink/85">Posting juga ke feed (anonim)</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-ink/55">
            Default OFF — sesi ini cuma jadi rekam medis privat. Centang kalau lo mau ceritanya dilihat
            & dapat support dari user lain. Identitas lo tetap anonim.
          </p>
        </div>
      </label>

      {err && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-100">
          ⚠️ {err}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="rounded-full bg-gradient-to-r from-sky-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Sesi & Lihat Saran →"}
      </button>
    </form>
  );
}
