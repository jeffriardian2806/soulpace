"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function deviceId(): string {
  try {
    let id = localStorage.getItem("sp_vid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem("sp_vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function EpisodeView({ episodeId }: { episodeId: string }) {
  useEffect(() => {
    const supabase = createClient();
    // login -> dihitung per akun; belum login -> per perangkat (p_key)
    // WAJIB .then() supaya request-nya benar-benar dikirim (builder Supabase itu lazy)
    supabase
      .rpc("record_episode_view", { p_episode: episodeId, p_key: deviceId() })
      .then(({ error }) => {
        if (error) console.error("record_episode_view error:", error.message);
      });
  }, [episodeId]);
  return null;
}
