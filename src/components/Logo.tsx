import { Waves } from "lucide-react";

type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { icon: string; text: string }> = {
  sm: { icon: "w-5 h-5", text: "text-base" },
  md: { icon: "w-7 h-7", text: "text-xl" },
  lg: { icon: "w-10 h-10", text: "text-3xl" },
};

// Logo teks + icon (ganti logo-full.png lama yang masih bertuliskan Flouwell)
export default function Logo({ size = "md" }: { size?: LogoSize }) {
  const s = SIZES[size];
  return (
    <span className="flex items-center gap-2">
      <Waves className={`${s.icon} text-sky-500`} aria-hidden="true" />
      <span className={`${s.text} font-semibold text-ink`}>Soulpace</span>
    </span>
  );
}
