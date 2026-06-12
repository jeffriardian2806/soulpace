"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { MOODS, WISHES } from "@/core/moods";

type State = { error: string | null };
type Action = (prev: State, fd: FormData) => Promise<State>;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan perubahan"}
    </button>
  );
}

export function EditPostForm({
  postId,
  initialBody,
  initialMood,
  initialWish,
  action,
}: {
  postId: string;
  initialBody: string;
  initialMood: string;
  initialWish: string;
  action: Action;
}) {
  const [state, formAction] = useActionState<State, FormData>(action, { error: null });
  const [mood, setMood] = useState<string>(initialMood);
  const [wish, setWish] = useState<string>(initialWish);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        name="body"
        required
        rows={6}
        maxLength={5000}
        defaultValue={initialBody}
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-sm leading-relaxed outline-none focus:border-sky-400"
      />

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink/55">Lagi ngerasa apa? (opsional)</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.slug}
              type="button"
              onClick={() => setMood(mood === m.slug ? "" : m.slug)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                mood === m.slug ? "bg-sky-500 text-white" : "bg-white/70 text-ink/70 hover:bg-sky-50"
              }`}
            >
              <span className="leading-none">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-ink/55">Butuh apa dari yang baca? (opsional)</p>
        <div className="flex flex-wrap gap-2">
          {WISHES.map((w) => (
            <button
              key={w.slug}
              type="button"
              onClick={() => setWish(wish === w.slug ? "" : w.slug)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                wish === w.slug ? "bg-sky-500 text-white" : "bg-white/70 text-ink/70 hover:bg-sky-50"
              }`}
            >
              <span className="leading-none">{w.emoji}</span>
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" name="mood" value={mood} />
      <input type="hidden" name="wish" value={wish} />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <SubmitBtn />
    </form>
  );
}
