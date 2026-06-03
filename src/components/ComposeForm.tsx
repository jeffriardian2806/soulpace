"use client";

import { useActionState } from "react";
import type { Category } from "@/core/entities/post";

type ComposeState = { error: string | null };
type Action = (prev: ComposeState, fd: FormData) => Promise<ComposeState>;

export function ComposeForm({
  categories,
  action,
}: {
  categories: Category[];
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<ComposeState, FormData>(
    action,
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <select
        name="category_id"
        required
        defaultValue=""
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-sky-400"
      >
        <option value="" disabled>
          Pilih kategori
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <textarea
        name="body"
        required
        rows={6}
        maxLength={5000}
        placeholder="Luapkan apa yang kamu rasakan. Di sini kamu nggak akan dihakimi."
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-sm leading-relaxed outline-none focus:border-sky-400"
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim curhat"}
      </button>
    </form>
  );
}
