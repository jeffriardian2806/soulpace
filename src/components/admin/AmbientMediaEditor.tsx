"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMediaAction, deleteMediaAction } from "@/app/admin/games/ambient-media/actions";

type Media = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  kind: "audio" | "video_direct" | "video_youtube" | "video_vimeo";
  media_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[];
  sort_order: number;
  is_active: boolean;
};

export function AmbientMediaEditor({ items }: { items: Media[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Media | null>(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSave = (data: Parameters<typeof saveMediaAction>[0]) => {
    startTransition(async () => {
      const r = await saveMediaAction(data);
      if (r.error) setMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Tersimpan");
        setEditing(null);
        setAdding(false);
        router.refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  const onDelete = (id: string, title: string) => {
    if (!confirm(`Hapus "${title}"?`)) return;
    startTransition(async () => {
      const r = await deleteMediaAction(id);
      if (r.error) setMsg("⚠️ " + r.error);
      else { setMsg("✓ Dihapus"); router.refresh(); setTimeout(() => setMsg(null), 2000); }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm ${msg.startsWith("⚠️") ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"} ring-1 ring-current/20`}>
          {msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/55">{items.length} media · {items.filter(i => i.is_active).length} aktif</p>
        <button onClick={() => setAdding(true)} className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white">+ Media baru</button>
      </div>

      <div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100">
        <p className="text-xs font-semibold text-sky-700">💡 Cara dapetin URL:</p>
        <ul className="mt-1 list-disc list-inside text-[11px] leading-relaxed text-ink/70 space-y-0.5">
          <li><strong>Audio MP3</strong>: Pixabay (pixabay.com/sound-effects) atau Freesound (CC0, free) — copy direct URL</li>
          <li><strong>YouTube</strong>: copy URL biasa (mis. youtube.com/watch?v=XXX), pilih kind=&quot;YouTube&quot;</li>
          <li><strong>Vimeo</strong>: copy URL biasa, pilih kind=&quot;Vimeo&quot;</li>
          <li><strong>Direct MP4</strong>: upload ke Cloudflare R2 / Bunny CDN, paste direct URL</li>
        </ul>
      </div>

      {adding && (
        <MediaForm media={null} onSave={onSave} onCancel={() => setAdding(false)} isPending={isPending} />
      )}

      {items.map((m) => (
        <section key={m.id} className="rounded-2xl bg-white ring-1 ring-ink/10 p-4">
          {editing?.id === m.id ? (
            <MediaForm media={m} onSave={onSave} onCancel={() => setEditing(null)} isPending={isPending} />
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-3xl">{m.emoji ?? "🎵"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">
                  {m.title}
                  {m.is_active ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">aktif</span>
                  ) : (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">draft</span>
                  )}
                </p>
                {m.description && <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{m.description}</p>}
                <p className="mt-1 text-[10px] text-ink/40 truncate">
                  <strong>{m.kind}</strong> · {m.media_url ?? "URL belum diisi"}
                </p>
                <p className="text-[10px] text-ink/40">tags: {m.tags.map(t => `#${t}`).join(" ") || "—"} · sort: {m.sort_order}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button onClick={() => setEditing(m)} className="rounded bg-sky-50 px-2 py-1 text-[10px] text-sky-700 ring-1 ring-sky-200">✏️</button>
                <button onClick={() => onDelete(m.id, m.title)} className="rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700 ring-1 ring-rose-200">🗑️</button>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function MediaForm({ media, onSave, onCancel, isPending }: {
  media: Media | null;
  onSave: (data: Parameters<typeof saveMediaAction>[0]) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [slug, setSlug] = useState(media?.slug ?? "");
  const [title, setTitle] = useState(media?.title ?? "");
  const [description, setDescription] = useState(media?.description ?? "");
  const [emoji, setEmoji] = useState(media?.emoji ?? "");
  const [kind, setKind] = useState<Media["kind"]>(media?.kind ?? "audio");
  const [mediaUrl, setMediaUrl] = useState(media?.media_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(media?.thumbnail_url ?? "");
  const [durationSec, setDurationSec] = useState<string>(media?.duration_seconds?.toString() ?? "");
  const [tagsStr, setTagsStr] = useState(media?.tags.join(", ") ?? "");
  const [sortOrder, setSortOrder] = useState(media?.sort_order ?? 99);
  const [isActive, setIsActive] = useState(media?.is_active ?? false);

  const submit = () => {
    onSave({
      id: media?.id,
      slug, title, description, emoji, kind,
      media_url: mediaUrl, thumbnail_url: thumbnailUrl,
      duration_seconds: durationSec ? parseInt(durationSec) : null,
      tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean),
      sort_order: sortOrder,
      is_active: isActive,
    });
  };

  return (
    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{media ? "Edit media" : "Media baru"}</p>
      <div className="flex gap-2">
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🌊" className="w-16 rounded-lg border border-ink/15 px-3 py-2 text-sm text-center" maxLength={4} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (mis. Sungai Mengalir)" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-unik" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description singkat" rows={2} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as Media["kind"])} className="rounded-lg border border-ink/15 px-3 py-2 text-sm">
          <option value="audio">🔊 Audio (MP3/Opus direct URL)</option>
          <option value="video_direct">🎬 Video direct (MP4 URL)</option>
          <option value="video_youtube">▶️ YouTube</option>
          <option value="video_vimeo">▶️ Vimeo</option>
        </select>
      </div>
      <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Media URL (https://...)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Thumbnail URL (optional, untuk video)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono" />
      <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="Tags (comma-separated, mis. nature, rain, sleep)" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink/70">
          Duration (sec): <input type="number" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} className="w-20 rounded border border-ink/15 px-2 py-1 text-xs" />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink/70">
          Sort: <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="w-16 rounded border border-ink/15 px-2 py-1 text-xs" />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink/70">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={isPending} className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          {isPending ? "Saving..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2 text-xs font-medium text-ink/70 ring-1 ring-ink/15">Cancel</button>
      </div>
    </div>
  );
}
