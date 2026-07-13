"use client";

type ActiveUsersData = { total_users: number; dau: number; wau: number; mau: number };
type RegistrationRow = { day: string; count: number };
type RetentionRow = { cohort_date: string; cohort_size: number; d1_active: number; d7_active: number; d30_active: number };
type FeatureRow = { feature: string; total_events: number; unique_users: number };
type DailyRow = { day: string; active_users: number; total_events: number };

const FEATURE_LABEL: Record<string, string> = {
  mood: "🎨 Mood Check-in",
  game_result: "🎮 Hasil Game",
  quiz_result: "🧠 Hasil Quiz",
  aura_scan: "🔮 Scan Aura",
  scan_diri: "🎭 Scan Diri AR",
  consultation: "💬 Konsultasi",
  post: "✍️ Post Feed",
};

export function AnalyticsDashboard({ registrations, activeUsers, retention, features, daily }: {
  registrations: RegistrationRow[]; activeUsers: ActiveUsersData; retention: RetentionRow[]; features: FeatureRow[]; daily: DailyRow[];
}) {
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const pct = (num: number, den: number) => den === 0 ? "-" : `${Math.round((num / den) * 100)}%`;

  // Chart: registrations 30 hari — sparkline sederhana pakai div bar
  const maxReg = Math.max(1, ...registrations.map((r) => Number(r.count)));
  const maxAct = Math.max(1, ...daily.map((d) => Number(d.active_users)));
  const totalReg30d = registrations.reduce((a, r) => a + Number(r.count), 0);
  const totalEvents30d = daily.reduce((a, d) => a + Number(d.total_events), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Kartu ringkasan */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total User" value={activeUsers.total_users} tone="sky" hint="Semua akun yang pernah register." />
        <StatCard label="DAU · Aktif 24 jam" value={activeUsers.dau} tone="emerald" hint="Yang buka & pakai app dalam 24 jam terakhir." />
        <StatCard label="WAU · Aktif 7 hari" value={activeUsers.wau} tone="amber" hint="Yang pakai app minggu ini." />
        <StatCard label="MAU · Aktif 30 hari" value={activeUsers.mau} tone="rose" hint="Yang pakai app bulan ini." />
      </section>

      {/* Chart registrasi + aktivitas harian */}
      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">Registrasi 30 hari</h2>
          <p className="text-xs text-ink/50">Total: <b className="text-ink">{totalReg30d}</b> user</p>
        </div>
        <BarChart data={registrations.map((r) => ({ label: fmtDate(r.day), value: Number(r.count) }))} max={maxReg} color="#0ea5e9" />
      </section>

      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">Aktivitas harian 30 hari</h2>
          <p className="text-xs text-ink/50">Total event: <b className="text-ink">{totalEvents30d}</b></p>
        </div>
        <BarChart data={daily.map((d) => ({ label: fmtDate(d.day), value: Number(d.active_users) }))} max={maxAct} color="#10b981" />
        <p className="mt-2 text-[11px] italic text-ink/45">Bar = unique user aktif per hari.</p>
      </section>

      {/* Fitur ranking */}
      <section className="glass rounded-2xl p-4">
        <h2 className="mb-3 text-base font-bold text-ink">Fitur paling sering dipakai (30 hari)</h2>
        {features.length === 0 ? (
          <p className="text-xs italic text-ink/45">Belum ada aktivitas 30 hari terakhir.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {features.map((f) => {
              const total = features.reduce((a, x) => a + Number(x.total_events), 0);
              const pctBar = total === 0 ? 0 : (Number(f.total_events) / total) * 100;
              return (
                <li key={f.feature}>
                  <div className="mb-0.5 flex items-baseline justify-between text-xs">
                    <span className="font-medium text-ink">{FEATURE_LABEL[f.feature] ?? f.feature}</span>
                    <span className="text-ink/55"><b className="text-ink">{f.total_events}</b> event · {f.unique_users} user unik</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${pctBar}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Retention kohort */}
      <section className="glass rounded-2xl p-4">
        <h2 className="mb-1 text-base font-bold text-ink">Retention kohort (30 hari)</h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink/55">
          Dari user yang register di tanggal X, berapa % yang balik lagi ke app. D1 = besoknya, D7 = 1 minggu setelahnya, D30 = 1 bulan setelahnya.
        </p>
        {retention.length === 0 ? (
          <p className="text-xs italic text-ink/45">Belum ada data kohort.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/55">
                  <th className="py-2 pr-3">Kohort</th>
                  <th className="py-2 pr-3">Ukuran</th>
                  <th className="py-2 pr-3">D1</th>
                  <th className="py-2 pr-3">D7</th>
                  <th className="py-2 pr-3">D30</th>
                </tr>
              </thead>
              <tbody>
                {retention.map((c) => (
                  <tr key={c.cohort_date} className="border-b border-ink/5">
                    <td className="py-2 pr-3 font-medium text-ink">{fmtDate(c.cohort_date)}</td>
                    <td className="py-2 pr-3 text-ink/70">{c.cohort_size}</td>
                    <td className="py-2 pr-3"><RetentionCell num={Number(c.d1_active)} den={Number(c.cohort_size)} /></td>
                    <td className="py-2 pr-3"><RetentionCell num={Number(c.d7_active)} den={Number(c.cohort_size)} /></td>
                    <td className="py-2 pr-3"><RetentionCell num={Number(c.d30_active)} den={Number(c.cohort_size)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="rounded-lg bg-sky-50 p-3 text-[11px] leading-relaxed text-sky-800 ring-1 ring-sky-200">
        Insight buat lo: kalau D7 &lt; 20%, retention masih lemah — perbaiki produk dulu sebelum agresif marketing.
        Kalau D7 &gt; 30%, retensi udah oke — worth push traffic. Fitur paling atas di ranking = value proposition lo yang paling kuat.
      </p>
    </div>
  );
}

function StatCard({ label, value, tone, hint }: { label: string; value: number; tone: "sky" | "emerald" | "amber" | "rose"; hint: string }) {
  const bg = { sky: "bg-sky-50 ring-sky-200 text-sky-800", emerald: "bg-emerald-50 ring-emerald-200 text-emerald-800", amber: "bg-amber-50 ring-amber-200 text-amber-800", rose: "bg-rose-50 ring-rose-200 text-rose-800" }[tone];
  return (
    <div className={`rounded-2xl p-3 ring-1 ${bg}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-[10px] leading-tight opacity-60">{hint}</p>
    </div>
  );
}

function BarChart({ data, max, color }: { data: { label: string; value: number }[]; max: number; color: string }) {
  return (
    <div className="flex h-32 items-end gap-0.5">
      {data.map((d, i) => {
        const h = max === 0 ? 0 : (d.value / max) * 100;
        return (
          <div key={i} className="group relative flex-1">
            <div className="w-full rounded-t transition-opacity hover:opacity-70" style={{ height: `${Math.max(h, 2)}%`, background: color }} title={`${d.label}: ${d.value}`} />
            <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-0.5 text-[10px] text-white group-hover:block">
              {d.label}: {d.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RetentionCell({ num, den }: { num: number; den: number }) {
  if (den === 0) return <span className="text-ink/40">-</span>;
  const pct = Math.round((num / den) * 100);
  const color = pct >= 30 ? "text-emerald-700 bg-emerald-50" : pct >= 15 ? "text-amber-700 bg-amber-50" : pct > 0 ? "text-rose-700 bg-rose-50" : "text-ink/40 bg-ink/5";
  return <span className={`rounded px-1.5 py-0.5 font-mono font-bold ${color}`}>{pct}%</span>;
}
