import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/auth/actions";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-medium text-ink">Buat akun</h1>
        <p className="mt-1 text-sm text-ink/60">
          Nama tampilan kamu dibuat otomatis dan anonim.
        </p>
      </div>
      <AuthForm action={registerAction} submitLabel="Daftar" />
      <Link href="/login" className="text-center text-sm text-ink/60">
        Sudah punya akun? Masuk
      </Link>
    </main>
  );
}
