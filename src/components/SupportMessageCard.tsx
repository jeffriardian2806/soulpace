import Link from "next/link";
import { TTSButton } from "@/components/voice/TTSButton";

export function SupportMessageCard({ message, dismissible = false, onDismiss }: { message: string; dismissible?: boolean; onDismiss?: () => void }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 ring-1 ring-sky-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💙</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-sky-700 font-semibold">Pesan dari Soulpace</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">{message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TTSButton text={message} label="Dengerin" />
            <Link href="/skrining" className="text-xs font-medium text-sky-600 hover:underline">
              Lihat skrining lagi
            </Link>
            <Link href="/resource" className="text-xs font-medium text-rose-600 hover:underline">
              🌐 Pusat Bantuan
            </Link>
          </div>
        </div>
        {dismissible && onDismiss && (
          <button onClick={onDismiss} aria-label="Tutup" className="text-ink/30 hover:text-ink/60 text-lg leading-none">✕</button>
        )}
      </div>
    </div>
  );
}
