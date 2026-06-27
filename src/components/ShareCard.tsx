"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

export function ShareCard({ text }: { text: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function toBlob(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  function download(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flouwell.png";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (!blob) return;
      const file = new File([blob], "flouwell.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        download(blob);
      }
    } catch {
      // dibatalkan / gagal — abaikan
    }
    setBusy(false);
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const blob = await toBlob();
      if (blob) download(blob);
    } catch {}
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={cardRef}
        style={{
          width: 320,
          minHeight: 420,
          padding: 32,
          borderRadius: 24,
          background: "linear-gradient(160deg, #38BDF8 0%, #0284C7 100%)",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 20, lineHeight: 1.55, fontWeight: 500 }}>
          &ldquo;{text}&rdquo;
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 28 }}>
          Flouwell — ruang melampiaskan beban
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={busy}
          className="rounded-2xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Menyiapkan..." : "Bagikan"}
        </button>
        <button
          onClick={handleDownload}
          disabled={busy}
          className="glass rounded-2xl px-5 py-2 text-sm font-medium text-ink disabled:opacity-60"
        >
          Download gambar
        </button>
      </div>
    </div>
  );
}
