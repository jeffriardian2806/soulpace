import { getConsultationContextById, getPatientMedicalReports } from "@/lib/telekonsul/queries";

type Props = {
  consultationSessionId: string | null;
  patientId: string;
  viewerRole: "patient" | "psikolog";
};

type GameResult = {
  id: string;
  game_key: string;
  summary: { title?: string; headline?: string; value?: string; secondary?: string; emoji?: string } | null;
  detail: { score?: number; max?: number; band_label?: string; band_advice?: string; severity?: string; crisis?: boolean } | null;
  created_at: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export async function RekamMedisPanel({ consultationSessionId, patientId, viewerRole }: Props) {
  const session = consultationSessionId ? await getConsultationContextById(consultationSessionId) : null;

  const allReports = (await getPatientMedicalReports(patientId)) as GameResult[];
  const screeningReports = allReports.filter((r) => r.game_key.startsWith("screening_"));

  const saranList =
    (session?.saran_taken as Array<{ type: string; slug?: string }>) ?? [];

  const cat = session?.category as
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
  const catName = Array.isArray(cat) ? cat?.[0]?.name : cat?.name;

  const hasAnyData = session?.keluhan_text || screeningReports.length > 0 || saranList.length > 0;

  return (
    <details className="group rounded-2xl bg-amber-50/70 ring-1 ring-amber-200" open>
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3">
        <span className="text-xl">📋</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-900">
            {viewerRole === "psikolog" ? "Rekam Medis Pasien" : "Rekam Medis Lo (yang psikolog liat)"}
          </p>
          <p className="text-[10px] text-amber-700/80">
            {catName ? `Kategori: ${catName}` : "Laporan pemeriksaan"}
          </p>
        </div>
        <span className="text-amber-700 transition group-open:rotate-180">▾</span>
      </summary>

      <div className="border-t border-amber-200/50 px-4 py-3">
        {!hasAnyData && (
          <p className="rounded-lg bg-ink/5 px-3 py-2 text-[11px] italic text-ink/55">
            {viewerRole === "psikolog"
              ? "Pasien belum melakukan pemeriksaan apapun (skrining/MHCU). Belum ada data rekam medis."
              : "Lo belum punya laporan pemeriksaan. Hasil skrining/MHCU lo bakal muncul di sini buat psikolog."}
          </p>
        )}

        {session?.keluhan_text && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/70">Keluhan</p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink/80">
              {session.keluhan_text}
            </p>
          </>
        )}

        {screeningReports.length > 0 && (
          <>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-amber-900/70">
              Laporan Pemeriksaan ({screeningReports.length})
            </p>
            <ul className="mt-1 flex flex-col gap-2">
              {screeningReports.map((r) => (
                <li key={r.id} className="rounded-lg bg-white p-2.5 text-xs ring-1 ring-amber-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-ink">
                      {r.summary?.emoji ?? "📋"} {r.summary?.title ?? r.game_key}
                    </p>
                    <span className="shrink-0 text-[10px] text-ink/45">{fmtDate(r.created_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {r.summary?.value && (
                      <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                        {r.summary.value}
                      </span>
                    )}
                    {r.summary?.headline && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.detail?.severity === "severe"
                            ? "bg-rose-100 text-rose-800"
                            : r.detail?.severity === "moderate"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.summary.headline}
                      </span>
                    )}
                    {r.detail?.crisis && (
                      <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ⚠️ Crisis flag
                      </span>
                    )}
                  </div>
                  {r.detail?.band_advice && (
                    <p className="mt-1 text-[11px] leading-relaxed text-ink/60">
                      {r.detail.band_advice}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {saranList.length > 0 && (
          <>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-amber-900/70">
              Saran Yang Sudah Diambil
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {saranList.map((s, i) => (
                <li key={i} className="text-xs text-ink/75">
                  ✓ <strong>{s.type}</strong>
                  {s.slug && <span className="text-ink/55"> · {s.slug}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </details>
  );
}
