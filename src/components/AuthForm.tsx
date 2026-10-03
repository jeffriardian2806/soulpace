"use client";

import { useEffect, useState, useTransition } from "react";
import { sendOtpAction, verifyOtpAction } from "@/app/auth/actions";

const RESEND_COOLDOWN = 60; // detik, samain sama limit default Supabase

// Satu form buat masuk & daftar: email -> kode 6 digit -> masuk.
export function AuthForm({ submitLabel }: { submitLabel: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  // Hitung mundur tombol "Kirim ulang"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function requestCode(target: string, successInfo: string | null = null) {
    setErr(null); setInfo(null);
    startTransition(async () => {
      const res = await sendOtpAction(target);
      if (res.error) { setErr(res.error); return; }
      setSentTo(target.trim().toLowerCase());
      setCooldown(RESEND_COOLDOWN);
      setInfo(successInfo);
    });
  }

  function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    requestCode(email);
  }

  function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setErr(null); setInfo(null);
    startTransition(async () => {
      // Sukses -> action redirect ke /main, jadi cuma error yang balik ke sini.
      const res = await verifyOtpAction(sentTo, code);
      if (res?.error) setErr(res.error);
    });
  }

  function onResend() {
    if (!sentTo || cooldown > 0) return;
    setCode("");
    requestCode(sentTo, "Kode baru sudah dikirim.");
  }

  function onChangeEmail() {
    setSentTo(null); setCode(""); setErr(null); setInfo(null);
  }

  if (!sentTo) {
    return (
      <form onSubmit={onSubmitEmail} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 outline-none focus:border-sky-400"
        />
        {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">⚠️ {err}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Mengirim kode..." : submitLabel}
        </button>
        <p className="text-center text-xs text-ink/50">
          Kami kirim kode 6 digit ke emailmu buat masuk.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitCode} className="flex flex-col gap-3">
      <p className="text-center text-sm leading-relaxed text-ink/70">
        Kode 6 digit sudah dikirim ke <span className="font-semibold text-ink">{sentTo}</span>.
        Cek juga folder spam.
      </p>
      <input
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        required
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="••••••"
        aria-label="Kode 6 digit"
        className="rounded-xl border border-sky-100 bg-white/70 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-sky-400"
      />
      {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">⚠️ {err}</p>}
      {info && !err && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✓ {info}</p>}
      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Verifikasi"}
      </button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onChangeEmail} disabled={pending} className="text-ink/60 hover:text-ink/80">
          Ganti email
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={pending || cooldown > 0}
          className="font-medium text-sky-600 disabled:text-ink/40"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : "Kirim ulang kode"}
        </button>
      </div>
    </form>
  );
}
