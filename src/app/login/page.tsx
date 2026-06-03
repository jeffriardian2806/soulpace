import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-medium text-ink">Masuk</h1>
      <AuthForm action={loginAction} submitLabel="Masuk" />
      <Link href="/register" className="text-center text-sm text-ink/60">
        Belum punya akun? Daftar
      </Link>
    </main>
  );
}
