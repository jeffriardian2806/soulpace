"use client";

import { useEffect, useState } from "react";

/**
 * Tombol darurat yang muncul otomatis jika halaman gagal render dalam 6 detik.
 * Sekali klik = unregister service worker + clear cache + reload.
 * Ditujukan untuk kasus aplikasi stuck di logo (bug service worker versi lama).
 */
export function RefreshAppFallback() {
  const [show, setShow] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    // Kalau dalam 6 detik page belum "interactive", tampilkan tombol.
    const t = setTimeout(() => {
      // Kalau document udah complete, kemungkinan besar page normal — jangan tampil.
      if (document.readyState !== "complete") {
        setShow(true);
      } else {
        // Kalau complete tapi konten utama gak ada, tetap tampil sebagai jaring pengaman.
        const main = document.querySelector("main");
        if (!main || (main.textContent ?? "").trim().length < 20) setShow(true);
      }
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const refresh = async () => {
    setRunning(true);
    try {
      // Unregister semua service worker
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      // Hapus semua cache
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch { /* lanjut reload apapun errornya */ }
    // Force reload dari server (bukan cache)
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
