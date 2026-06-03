"use client";

import { useActionState } from "react";

type HandleState = { error: string | null; ok: boolean };
type Action = (prev: HandleState, fd: FormData) => Promise<HandleState>;

export function HandleForm({
  current,
  action,
}: {
  current: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<HandleState, FormData>(
    action,
    { error: null, ok: false }
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        name="handle"
        defaultValue={current}
        minLength={3}
        maxLength={20}
        required
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-sm outline-none focus:border-sky-400"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm text-sky-600">Handle berhasil diubah.</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-2xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan handle"}
      </button>
    </form>
  );
}
