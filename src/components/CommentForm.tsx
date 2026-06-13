"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

type Action = (fd: FormData) => Promise<void>;

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Mengirim..." : "Kirim"}
    </button>
  );
}

export function CommentForm({
  storyId,
  action,
}: {
  storyId: string;
  action: Action;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="story_id" value={storyId} />
      <textarea
        name="body"
        required
        rows={2}
        maxLength={2000}
        placeholder="Tulis komentar yang suportif..."
        className="rounded-xl border border-ink/10 bg-white/60 p-2.5 text-sm text-ink outline-none focus:border-sky-300"
      />
      <SubmitBtn />
    </form>
  );
}
