"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Soft gate buat guest: ngitung jumlah interaction (buka cerita/episode/dst)
 * di localStorage. Setelah threshold tertentu:
 *  - 3x: banner kecil dismissible
 *  - 5x: modal lembut dismissible
 * Tidak hard wall, tidak time-based, SEO aman (render client-only).
 *
 * Render apa-apa hanya kalau:
 *  - isGuest=true (user belum login)
 *  - belum di-dismiss sesi ini
 */

const KEY_COUNT = "sp_guest_views";
const KEY_DISMISS_BANNER = "sp_gate_banner_off";
const KEY_DISMISS_MODAL = "sp_gate_modal_off";
const BANNER_AT = 3;
const MODAL_AT = 5;

export function GuestPrompt({ isGuest, trackOpen = true }: { isGuest: boolean; trackOpen?: boolean }) {
  const [count, setCount] = useState<number | null>(null);
  const [bannerOff, setBannerOff] = useState(false);
  const [modalOff, setModalOff] = useState(false);

  useEffect(() => {
    if (!isGuest) return;
    let c = Number(localStorage.getItem(KEY_COUNT) ?? "0");
    if (trackOpen) {
      c += 1;
      localStorage.setItem(KEY_COUNT, String(c));
    }
    setCount(c);
    setBannerOff(localStorage.getItem(KEY_DISMISS_BANNER) === "1");
    setModalOff(localStorage.getItem(KEY_DISMISS_MODAL) === "1");
  }, [isGuest, trackOpen]);

  if (!isGuest || count === null) return null;

  const showModal = count >= MODAL_AT && !modalOff;
  const showBanner = !showModal && count >= BANNER_AT && !bannerOff;

  function dismissBanner() {
    localStorage.setItem(KEY_DISMISS_BANNER, "1");
    setBannerOff(true);
  }
  function dismissModal() {
    localStorage.setItem(KEY_DISMISS_MODAL, "1");
    setModalOff(true);
  }

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-black/40" onClick={dismissModal} aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
          <p className="text-2xl">🤍</p>
          <h2 className="mt-2 text-lg font-bold text-ink">Kamu kelihatan tertarik</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/65">
            Daftar dulu yuk biar bisa kasih peluk, balas cerita, atau curhat juga. Gratis,
            anonim, dan aman — nama asli kamu nggak akan ditampilkan.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/register"
              className="rounded-full bg-sky-500 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Daftar sekarang
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-ink/70 ring-1 ring-sky-100"
            >
              Sudah punya akun, masuk
            </Link>
            <button
              type="button"
              onClick={dismissModal}
              className="text-xs font-medium text-ink/40"
            >
              Nanti aja
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showBanner) {
    return (
      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-sky-100">
        <p className="flex-1 text-xs leading-relaxed text-ink/70">
          Mau ikut nimbrung peluk &amp; komen? Daftar gratis, anonim, &amp; aman.
        </p>
        <Link
          href="/register"
          className="shrink-0 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Daftar
        </Link>
        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Tutup"
          className="shrink-0 text-base text-ink/40"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
