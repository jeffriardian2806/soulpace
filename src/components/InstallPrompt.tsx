"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (standalone) return; // udah keinstall, ga usah tampil

    try {
      if (localStorage.getItem("sp_install_dismissed") === "1") return;
    } catch {}

    const ios = /iphone|ipad|ipod/i.test(nav.userAgent);
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem("sp_install_dismissed", "1");
    } catch {}
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-white p-3 shadow-lg shadow-sky-900/15 ring-1 ring-sky-100">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-192.png"
          alt="Flouwell"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl"
        />
        <div className="flex-1 text-sm leading-snug">
          {isIOS ? (
            <p className="text-ink/80">
              Pasang Flouwell: tap ikon <b>Bagikan</b>, lalu pilih{" "}
              <b>&ldquo;Add to Home Screen&rdquo;</b>.
            </p>
          ) : (
            <p className="font-medium text-ink">Pasang Flouwell di HP kamu</p>
          )}
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Pasang
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="shrink-0 px-1 text-ink/40"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
