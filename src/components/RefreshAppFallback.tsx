"use client";

import { useEffect, useState } from "react";

/**
 * Tombol darurat yang muncul HANYA jika aplikasi benar-benar stuck di HTML shell
 * (tidak ada <main> element sama sekali dalam 8 detik).
 *
 * Logika: kalau <main> pernah ke-render di session ini (sekali saja), tombol
 * dinonaktifkan permanen untuk session — karena berarti React sudah hydrate
 * dan aplikasi berjalan normal.
 */
export function RefreshAppFallback() {
  const [show, setShow] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Kalau <main> udah ada sekarang (biasanya udah pas SSR selesai), langsung skip permanen.
    if (document.querySelector("main")) return;

    // Kasih waktu 8 detik. Kalau dalam window itu <main> muncul, batalin.
    let cancelled = false;

    // Observer: pantau apakah <main> muncul dalam periode tunggu
    const observer = new MutationObserver(() => {
      if (document.querySelector("main")) {
        cancelled = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      if (cancelled) return;
      // Cek final: kalau <main> tetep gak ada setelah 8 detik → stuck
      if (!document.querySelector("main")) setShow(true);
    }, 8000);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const refresh = async () => {
    setRunning(true);
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch { /* lanjut reload apapun errornya */ }
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-2xl ring-1 ring-ink/10">
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink">Aplikasi tidak merespons?</p>
          <p className="mt-0.5 text-xs text-ink/60">Muat ulang untuk memperbaiki.</p>
        </div>
        <button
          onClick={refresh}
          disabled={running}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {running ? "Memuat..." : "Refresh App"}
        </button>
      </div>
    </div>
  );
}
