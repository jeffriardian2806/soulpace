"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dismissPatternAction } from "@/app/api/patterns/actions";
import type { PatternNudge } from "@/lib/patterns/detect";

export function PatternNudgeBanner({ nudge }: { nudge: PatternNudge }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const handleDismiss = () => {
    setHidden(true);
    startTransition(async () => {
      await dismissPatternAction(nudge.type);
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 ring-1 ring-sky-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl shrink-0">{nudge.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink leading-snug">{nudge.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink/70">{nudge.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={nudge.primary_action.href}
              className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform"
            >
              {nudge.primary_action.label}
            </Link>
            {nudge.secondary_action && (
              <Link
                href={nudge.secondary_action.href}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink/70 ring-1 ring-ink/15"
              >
                {nudge.secondary_action.label}
              </Link>
            )}
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className="rounded-full bg-transparent px-2 py-1.5 text-xs font-medium text-ink/45 hover:text-ink/65"
            >
              Ga sekarang
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
