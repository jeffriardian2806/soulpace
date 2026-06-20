import Link from "next/link";

export function CrisisModeTopBanner() {
  return (
    <Link
      href="/crisis-mode"
      className="block rounded-2xl bg-gradient-to-br from-rose-500 via-rose-500 to-amber-500 p-3 ring-1 ring-rose-300 active:scale-[0.99] transition-transform"
      aria-label="Buka Crisis Mode - SAYA DI SINI"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">🛟</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">SAYA DI SINI</p>
          <p className="text-[11px] leading-tight text-white/90">Butuh ruang sekarang? Tap di sini — gw nemenin.</p>
        </div>
        <span className="text-white/80 text-xl">→</span>
      </div>
    </Link>
  );
}
