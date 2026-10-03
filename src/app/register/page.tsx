import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo-full.png" alt="Soulpace" width={220} height={73} priority className="h-auto w-[180px]" />
        <h1 className="text-2xl font-medium text-ink">Buat akun</h1>
        <p className="mt-1 text-sm text-ink/60">
          Cukup pakai email. Nama tampilan kamu dibuat otomatis dan anonim.
        </p>
      </div>
      <AuthForm submitLabel="Daftar" />
      <Link href="/login" className="text-center text-sm text-ink/60">
        Sudah punya akun? Masuk
      </Link>
    </main>
  );
}
