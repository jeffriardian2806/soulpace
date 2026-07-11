"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BannerItem = {
  id: string;
  title: string;
  price_text: string;
  event_date: string | null;
  category_label: string | null;   // dari DB (dinamis)
  category_emoji: string | null;
  cta: string;                     // dari ui_texts
};

const dismissKey = (id: string) => `flouwell:event_dismissed:${id}`;
const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

export function EventBanner({ items }: { items: BannerItem[] }) {
  const [visible, setVisible] = useState<BannerItem[]>([]);

  useEffect(() => {
    if (typeof localStorage === "undefined") { setVisible(items); return; }
    const today = todayStr();
    setVisible(items.filter((w) => localStorage.getItem(dismissKey(w.id)) !== today));
  }, [items]);

  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(dismissKey(id), todayStr());
    setVisible((v) => v.filter((x) => x.id !== id));
  };

  return (
    <div className="flex flex-col gap-2">
      {visible.map((w) => {
        const eventDate = w.event_date ? new Date(w.event_date).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", weekday: "short", day: "numeric", month: "short", year: "numeric" }) : null;
        // Label kategori — DINAMIS dari DB. Kalau kosong, fallback "Event".
        const catEmoji = w.category_emoji ?? "🎉";
        const catLabel = w.category_label ?? "Event";
        return (
          <div key={w.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-4 text-white shadow-lg ring-1 ring-white/20">
            <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 animate-pulse rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 animate-pulse rounded-full bg-yellow-200/30 blur-2xl" />
            <button onClick={() => dismiss(w.id)} className="absolute right-2 top-2 rounded-full bg-black/15 px-2 py-0.5 text-xs font-medium text-white/80 hover:bg-black/25" aria-label="Tutup">×</button>
            <div className="relative flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <span className="w-fit rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{catEmoji} {catLabel}</span>
                <p className="text-base font-bold leading-tight">{w.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-white/95">
                  {eventDate && <span>📅 {eventDate}</span>}
                  <span>💰 {w.price_text}</span>
                </div>
                <Link href={`/event/${w.id}`} className="mt-1 w-fit rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-white">{w.cta}</Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
