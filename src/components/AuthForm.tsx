"use client";

import { useActionState } from "react";

type FormState = { error: string | null; success?: boolean };
type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function AuthForm({
  action,
  submitLabel,
}: {
  action: Action;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    { error: null }
  );

  if (state.success) {
    return (
      <div className="rounded-2xl bg-sky-50 p-4 text-sm">
        <p className="font-semibold text-ink">Cek email kamu</p>
        <p className="mt-1 leading-relaxed text-ink/70">
          Kami sudah kirim link konfirmasi ke emailmu. Klik link itu untuk
          mengaktifkan akun — kamu langsung masuk setelahnya.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 outline-none focus:border-sky-400"
      />
      <input
        name="password"
        type="password"
        required
        placeholder="Kata sandi (min. 8 karakter)"
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 outline-none focus:border-sky-400"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Memproses..." : submitLabel}
      </button>
    </form>
  );
}
