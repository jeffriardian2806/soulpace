import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { getUiTexts } from "@/lib/uiTexts";

export const metadata = { title: "Analytics — Admin Flouwell" };

type ActiveUsersData = { total_users: number; anonymous_users: number; admin_users: number; dau: number; wau: number; mau: number };
type RegistrationRow = { day: string; count: number };
type RetentionRow = { cohort_date: string; cohort_size: number; d1_active: number; d7_active: number; d30_active: number };
type FeatureRow = { feature: string; total_events: number; unique_users: number };
type DailyRow = { day: string; active_users: number; total_events: number };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) redirect("/feed");

  const [regResp, activeResp, retentionResp, featureResp, dailyResp, texts] = await Promise.all([
    supabase.rpc("analytics_registrations", { days: 30 }),
    supabase.rpc("analytics_active_users"),
    supabase.rpc("analytics_retention", { days: 30 }),
    supabase.rpc("analytics_feature_usage", { days: 30 }),
    supabase.rpc("analytics_daily_activity", { days: 30 }),
    getUiTexts(["admin.analytics.title", "admin.analytics.subtitle"], {
      "admin.analytics.title": "📊 Analytics Dashboard",
      "admin.analytics.subtitle": "Ringkasan aktivitas user: registrasi, aktif harian/mingguan/bulanan, retention kohort, dan fitur paling sering dipakai.",
    }),
  ]);

  const err = regResp.error || activeResp.error || retentionResp.error || featureResp.error || dailyResp.error;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin" className="text-sm font-medium text-sky-600 hover:underline">← Admin</Link>
        <Link href="/admin/games" className="text-sm font-medium text-sky-600 hover:underline">⚙️ Konten Games</Link>
      </header>
      <h1 className="text-xl font-bold text-ink">{texts["admin.analytics.title"]}</h1>
      <p className="text-sm leading-relaxed text-ink/60">{texts["admin.analytics.subtitle"]}</p>

      {err ? (
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
          <p className="text-sm font-bold text-rose-800">⚠️ Gagal load data</p>
          <p className="mt-1 text-xs text-rose-700">{err.message}</p>
          <p className="mt-2 text-[11px] text-rose-600">Pastikan migration analytics sudah dijalankan di database.</p>
        </div>
      ) : (
        <AnalyticsDashboard
          registrations={(regResp.data ?? []) as RegistrationRow[]}
          activeUsers={(activeResp.data ?? { total_users: 0, anonymous_users: 0, admin_users: 0, dau: 0, wau: 0, mau: 0 }) as ActiveUsersData}
          retention={(retentionResp.data ?? []) as RetentionRow[]}
          features={(featureResp.data ?? []) as FeatureRow[]}
          daily={(dailyResp.data ?? []) as DailyRow[]}
        />
      )}
    </main>
  );
}
