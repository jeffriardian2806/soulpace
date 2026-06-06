"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitRoomEntryAction } from "@/app/main/actions";

export function RoomForm({ roomId }: { roomId: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const res = await submitRoomEntryAction(roomId, text);
      if (res.error) { setError(res.error); return; }
      setText("");
      router.refresh();
    });
  }

  return (
    <div className="glass rounded-2xl p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={280}
        placeholder="Tulis satu kalimat aja..."
        className="w-full rounded-xl border border-sky-100 bg-white/70 px-3 py-2 text-sm outline-none focus:border-sky-400"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || !text.trim()}
        className="mt-2 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim ke ruang hari ini"}
      </button>
    </div>
  );
}
