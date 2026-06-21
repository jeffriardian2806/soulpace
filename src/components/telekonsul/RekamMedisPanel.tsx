import Link from "next/link";
import { getConsultationContextById } from "@/lib/telekonsul/queries";

type Props = {
  consultationSessionId: string;
  viewerRole: "patient" | "psikolog";
};

export async function RekamMedisPanel({ consultationSessionId, viewerRole }: Props) {
  const session = await getConsultationContextById(consultationSessionId);
  if (!session) return null;

  const pemeriksaanList =
    (session.pemeriksaan_results as Array<{
      type: string;
      slug?: string;
      score?: number;
      band_label?: string;
      value?: number;
      note?: string;
    }>) ?? [];
  const skrinings = pemeriksaanList.filter((p) => p.type === "screening");
  const moods = pemeriksaanList.filter((p) => p.type === "mood");

  const cat = session.category as { name: string; slug: string } | { name: string; slug: string }[] | null;
  const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;

  return (
    <details className="group rounded-2xl bg-amber-50/70 ring-1 ring-amber-200" open>
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3">
        <span className="text-xl">📋</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-900">
            {viewerRole === "psikolog" ? "Rekam Medis Patient" : "Konteks Lo (Auto-shared)"}
          </p>
          <p className="text-[10px] text-amber-700/80">
            {catName && `Kategori: ${catName} · `}
            {new Date(session.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="text-amber-700 transition group-open:rotate-180">▾</span>
      </summary>

      <div className="border-t border-amber-200/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/70">Keluhan</p>
        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink/80">
          {session.keluhan_text}
        </p>

        {skrinings.length > 0 && (
          <>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-amber-900/70">
              Hasil Skrining
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {skrinings.map((s, i) => (
                <li key={i} className="text-xs text-ink/75">
                  • <strong>{s.slug?.toUpperCase()}</strong>: skor {s.score}
                  {s.band_label && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {s.band_label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {moods.length > 0 && (
          <>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-amber-900/70">
              Mood Tercatat
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {moods.map((m, i) => (
                <li key={i} className="text-xs text-ink/75">
                  • Mood value: {m.value}
                  {m.note && <span className="text-ink/55"> — {m.note}</span>}
                </li>
              ))}
            </ul>
          </>
        )}

        {viewerRole === "patient" && (
          <Link
            href={`/konsultasi/${session.id}`}
            className="mt-3 inline-block text-[11px] font-semibold text-emerald-700 hover:underline"
          >
            Liat full rekam medis →
          </Link>
        )}
      </div>
    </details>
  );
}
