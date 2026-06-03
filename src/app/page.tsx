import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Soulpace</h1>
        <p className="mt-2 text-ink/60">
          Tempat melampiaskan beban, tanpa dihakimi. Kamu nggak sendirian.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="rounded-2xl bg-sky-500 px-4 py-3 text-center font-semibold text-white"
        >
          Mulai
        </Link>
        <Link
          href="/feed"
          className="glass rounded-2xl px-4 py-3 text-center font-medium text-ink"
        >
          Lihat-lihat dulu
        </Link>
        <Link href="/login" className="text-center text-sm text-ink/55">
          Sudah punya akun? Masuk
        </Link>
      </div>
    </main>
  );
}
