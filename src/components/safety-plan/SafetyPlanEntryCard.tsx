import Link from "next/link";
import { getSafetyPlanAction } from "@/app/safety-plan/actions";

export async function SafetyPlanEntryCard() {
  const plan = await getSafetyPlanAction();
  const isComplete = plan?.is_complete === true;

  if (!isComplete) {
    return (
      <Link href="/safety-plan" className="rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-4 ring-1 ring-amber-200 transition-colors hover:bg-amber-100/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛟</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink">Daftar Aman <span className="ml-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">belum diisi</span></p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/60">Siapin emergency kit personal lo di moment tenang — akses cepat pas butuh banget</p>
          </div>
          <span className="text-xs text-amber-600">→</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-4 ring-1 ring-emerald-200">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛟</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">Daftar Aman <span className="ml-1 rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">✓ siap</span></p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/60">Emergency kit lo udah ready. Akses cepat di crisis mode</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href="/safety-plan/crisis" className="flex-1 rounded-full bg-rose-500 px-3 py-2 text-center text-xs font-semibold text-white">
          🆘 Crisis Mode
        </Link>
        <Link href="/safety-plan" className="flex-1 rounded-full bg-white px-3 py-2 text-center text-xs font-medium text-ink/70 ring-1 ring-sky-200">
          ✏️ Edit
        </Link>
      </div>
    </div>
  );
}
