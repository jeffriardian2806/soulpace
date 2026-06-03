"use client";

import { useActionState } from "react";

type ReplyState = { error: string | null };
type Action = (prev: ReplyState, fd: FormData) => Promise<ReplyState>;

export function ReplyForm({
  postId,
  action,
}: {
  postId: string;
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<ReplyState, FormData>(
    action,
    { error: null }
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="post_id" value={postId} />
      <textarea
        name="body"
        required
        rows={3}
        maxLength={3000}
        placeholder="Tulis balasan yang menguatkan..."
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-sm leading-relaxed outline-none focus:border-sky-400"
      />
      <label className="flex items-center gap-2 text-xs text-ink/60">
        <input type="checkbox" name="is_survivor" value="1" className="accent-sky-500" />
        Tandai: aku pernah ngalamin hal serupa
      </label>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-2xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Mengirim..." : "Kirim balasan"}
      </button>
    </form>
  );
}
