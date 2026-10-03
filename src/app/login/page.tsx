import Link from "next/link";
import Logo from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <h1 className="text-2xl font-medium text-ink">Masuk</h1>
      </div>
      <AuthForm submitLabel="Kirim kode" />
      <Link href="/register" className="text-center text-sm text-ink/60">
        Belum punya akun? Daftar
      </Link>
    </main>
  );
}
