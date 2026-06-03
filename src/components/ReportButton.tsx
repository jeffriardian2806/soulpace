"use client";

import { useState } from "react";

type Action = (fd: FormData) => Promise<void>;

export function ReportButton({
  targetType,
  targetId,
  action,
}: {
  targetType: "post" | "reply";
  targetId: string;
  action: Action;
}) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <span className="text-xs text-ink/40">Dilaporkan, terima kasih</span>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setDone(true);
      }}
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />
      <button type="submit" className="text-xs text-ink/40 hover:text-ink/70">
        Laporkan
      </button>
    </form>
  );
}
