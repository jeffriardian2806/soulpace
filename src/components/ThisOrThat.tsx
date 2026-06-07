"use client";

import { useState } from "react";
import Link from "next/link";
import { thisOrThatInsight } from "@/core/lightContent";

export function ThisOrThat({ prompts }: { prompts: { a: string; b: string }[] }) {
  const [i, setI] = useState(0);
  const [bCount, setBCount] = useState(0);
  const [done, setDone] = useState(false);

  function pick(isB: boolean) {
    if (isB) setBCount((c) => c + 1);
    if (i + 1 >= prompts.length) setDone(true);
    else setI((x) => x + 1);
  }

  if (done) {
    return (
      <div className="glass rounded-2xl p-5 text-center">
        <p className="text-2xl">🌙</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          {thisOrThatInsight(bCount, prompts.length)}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => { setI(0); setBCount(0); setDone(false); }}
            className="rounded-full glass px-4 py-2 text-xs font-medium text-ink/70"
          >
            Ulangi
          </button>
          <Link href="/main" className="rounded-full px-4 py-2 text-xs font-medium text-ink/50">Selesai</Link>
        </div>
      </div>
    );
  }

  const c = prompts[i];
  return (
    <div className="glass rounded-2xl p-5">
      <p className="mb-4 text-center text-xs text-ink/45">{i + 1}/{prompts.length} · pilih yang lebih kamu rasain</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => pick(false)}
          className="flex-1 rounded-2xl border border-sky-100 bg-white/70 px-4 py-6 text-sm font-medium text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          {c.a}
        </button>
        <button
          type="button"
          onClick={() => pick(true)}
          className="flex-1 rounded-2xl border border-sky-100 bg-white/70 px-4 py-6 text-sm font-medium text-ink/80 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          {c.b}
        </button>
      </div>
    </div>
  );
}
