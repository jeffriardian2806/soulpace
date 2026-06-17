import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResourceEditor } from "./ResourceEditor";

export const metadata = { title: "Resources — Admin Soulpace" };

export default async function AdminResourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const { data: rows } = await supabase
    .from("resources")
    .select("id, slug, kind, title, subtitle, body, url, phone, location, tags, sort_order, is_active")
    .order("kind")
    .order("sort_order");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">🌐 Resources</h1>
        <Link href="/admin/games" className="text-xs font-medium text-sky-600 underline">← Admin Games</Link>
      </header>
      <p className="text-sm leading-relaxed text-ink/60">
        Kelola Pusat Bantuan: daftar crisis lines, psikolog, artikel edukasi, komunitas, & worksheet. Toggle is_active buat publish/unpublish.
      </p>
      <ResourceEditor items={(rows ?? []) as { id: string; slug: string; kind: "crisis_line" | "psychologist" | "article" | "community" | "worksheet"; title: string; subtitle: string | null; body: string | null; url: string | null; phone: string | null; location: string | null; tags: string[]; sort_order: number; is_active: boolean }[]} />
    </main>
  );
}
