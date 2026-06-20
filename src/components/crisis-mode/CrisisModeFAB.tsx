"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = [
  "/",
  "/landing",
  "/login",
  "/register",
  "/crisis-mode",
];

const HIDDEN_PREFIXES = [
  "/admin",
  "/auth",
];

export function CrisisModeFAB() {
  const pathname = usePathname();
  if (!pathname) return null;

  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <Link
      href="/crisis-mode"
      aria-label="Buka Crisis Mode — SAYA DI SINI"
      className="fixed bottom-6 right-5 z-40 flex items-center gap-1.5 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/30 ring-2 ring-white/80 active:scale-95 transition-transform"
      style={{ animation: "fabPulse 3s ease-in-out infinite" }}
    >
      <span className="text-base">🛟</span>
      <span>SAYA DI SINI</span>
      <style jsx>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 4px 14px rgba(244, 63, 94, 0.3); }
          50% { box-shadow: 0 4px 24px rgba(244, 63, 94, 0.55); }
        }
      `}</style>
    </Link>
  );
}
