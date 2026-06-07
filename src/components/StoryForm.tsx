"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createStoryAction } from "@/app/cerita/actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Mengirim cerita...
        </span>
      ) : (
        "Terbitkan cerita"
      )}
    </button>
  );
}

type State = { error: string | null };

export function StoryForm() {
  const [state, formAction] = useActionState<State, FormData>(
    createStoryAction,
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="title"
        required
        maxLength={200}
        placeholder="Judul cerita"
        className="rounded-xl border border-ink/10 bg-white/60 p-3 text-base font-semibold text-ink outline-none focus:border-sky-300"
      />
      <textarea
        name="body"
        required
        rows={16}
        placeholder="Tulis ceritamu di sini... sepanjang yang kamu mau."
        className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm leading-relaxed text-ink outline-none focus:border-sky-300"
      />
      <input
        name="content_warning"
        maxLength={200}
        placeholder="Peringatan isi (opsional, mis. trauma, kekerasan)"
        className="rounded-xl border border-ink/10 bg-white/60 p-3 text-sm text-ink outline-none focus:border-sky-300"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitBtn />
    </form>
  );
}
