"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Action = (fd: FormData) => Promise<void>;

export function PostMenu({
  postId,
  canEdit,
  canReport,
  reportAction,
}: {
  postId: string;
  canEdit: boolean;
  canReport: boolean;
  reportAction?: Action;
}) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!canEdit && !canReport) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-7 w-7 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-sky-50 hover:text-ink/70"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-xl border border-sky-100 bg-white shadow-lg"
        >
          {canEdit && (
            <Link
              href={`/curhat/${postId}/edit`}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink/80 hover:bg-sky-50"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </Link>
          )}
          {canReport && reportAction && !reported && (
            <form
              action={async (fd) => {
                await reportAction(fd);
                setReported(true);
                setOpen(false);
              }}
            >
              <input type="hidden" name="target_type" value="post" />
              <input type="hidden" name="target_id" value={postId} />
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink/80 hover:bg-sky-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 21V3" />
                  <path d="M4 4h12l-2 4 2 4H4" />
                </svg>
                Laporkan
              </button>
            </form>
          )}
          {canReport && reportAction && reported && (
            <p className="px-3 py-2 text-xs text-ink/50">Dilaporkan, terima kasih</p>
          )}
        </div>
      )}
    </div>
  );
}
