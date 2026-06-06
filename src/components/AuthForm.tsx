"use client";

import { useActionState, useState } from "react";

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
  const [showPw, setShowPw] = useState(false);

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
      <div className="relative">
        <input
          name="password"
          type={showPw ? "text" : "password"}
          required
          placeholder="Kata sandi (min. 8 karakter)"
          className="w-full rounded-xl border border-sky-100 bg-white/70 px-4 py-3 pr-12 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/45 transition-colors hover:text-ink/70"
        >
          {showPw ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 8 10 8a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" y1="2" x2="22" y2="22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
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
