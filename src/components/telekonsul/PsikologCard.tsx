import Link from "next/link";
import Image from "next/image";
import type { Psikolog } from "@/lib/telekonsul/types";

export function PsikologCard({
  psikolog,
  fromSession,
}: {
  psikolog: Psikolog;
  fromSession?: string;
}) {
  const href = fromSession
    ? `/telekonsul/${psikolog.slug}?from_session=${fromSession}`
    : `/telekonsul/${psikolog.slug}`;
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10 transition hover:ring-sky-200"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-sky-100">
        {psikolog.photo_url ? (
          <Image src={psikolog.photo_url} alt={psikolog.full_name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🧑‍⚕️
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink">
          {psikolog.full_name}
          {psikolog.gelar && <span className="ml-1 font-normal text-ink/60">, {psikolog.gelar}</span>}
        </p>
        {psikolog.specializations.length > 0 && (
          <p className="mt-0.5 text-[11px] text-ink/55 line-clamp-1">
            {psikolog.specializations.slice(0, 3).join(" · ")}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {psikolog.is_chat_free_promo || psikolog.price_chat === 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              💬 Chat GRATIS
            </span>
          ) : (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              💬 Rp{psikolog.price_chat.toLocaleString("id-ID")}/sesi
            </span>
          )}
          {psikolog.rating_count > 0 && (
            <span className="text-[10px] text-ink/50">
              ⭐ {psikolog.rating_avg.toFixed(1)} ({psikolog.rating_count})
            </span>
          )}
        </div>
      </div>
      <span className="text-ink/30">→</span>
    </Link>
  );
}
