"use client";

import { useEffect, useState } from "react";
import { SupportMessageCard } from "./SupportMessageCard";

const KEY = "soulpace_support_banner_dismissed";

export function FeedSupportBanner({ message, triggeredAt }: { message: string; triggeredAt: string }) {
  // visible default false sampai useEffect cek localStorage — hindari flicker
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: { triggeredAt: string; dismissedAt: number } = JSON.parse(raw);
        // Kalo dismiss buat trigger yang SAMA (timestamp ngepas), skip
        if (parsed.triggeredAt === triggeredAt) {
          return;
        }
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [triggeredAt]);

  function dismiss() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ triggeredAt, dismissedAt: Date.now() }));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;
  return <SupportMessageCard message={message} dismissible onDismiss={dismiss} />;
}
