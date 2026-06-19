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
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <Link href={parentHref} className="text-xs font-medium text-sky-600 underline">
          {parentLabel}
        </Link>
      </header>
      {subtitle && <p className="text-sm leading-relaxed text-ink/60">{subtitle}</p>}
      {children}
    </main>
  );
}
