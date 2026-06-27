import Link from "next/link";
import Image from "next/image";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-4">
        <Image src="/logo-full.png" alt="Flouwell" width={220} height={73} priority className="h-auto w-[180px]" />
        <h1 className="text-2xl font-medium text-ink">Masuk</h1>
      </div>
      <AuthForm action={loginAction} submitLabel="Masuk" />
      <Link href="/register" className="text-center text-sm text-ink/60">
        Belum punya akun? Daftar
      </Link>
    </main>
  );
}
