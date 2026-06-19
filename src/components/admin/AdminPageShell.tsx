import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageShell({
  title,
  subtitle,
  children,
  parentHref = "/admin/games",
  parentLabel = "← Admin Games",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  parentHref?: string;
  parentLabel?: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href={parentHref} className="text-sm font-medium text-sky-600 hover:underline">
          {parentLabel}
        </Link>
        <Link href="/settings" className="text-xs text-ink/55 hover:text-ink/80">
          ⚙️ Pengaturan
        </Link>
      </header>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {subtitle && <p className="text-sm leading-relaxed text-ink/60">{subtitle}</p>}
      {children}
    </main>
  );
}
