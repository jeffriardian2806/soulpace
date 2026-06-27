"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { saveVideoAction, toggleVideoAction, deleteVideoAction, getVideoStatsAction } from "./actions";
import { extractYouTubeId, youtubeThumbnail } from "@/lib/videos/youtube";

type Video = {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
  category_slug: string | null;
  is_active: boolean;
  total_views: number;
  unique_viewers: number;
};
type Topic = { slug: string; title: string; emoji: string | null };

export function VideoEditor({ videos, topics }: { videos: Video[]; topics: Topic[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Video | null>(null);
  const [adding, setAdding] = useState(false);
  const [statsFor, setStatsFor] = useState<string | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="flex flex-col gap-4">
      {!adding && !editing && (
        <button
          onClick={() => setAdding(true)}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          + Tambah video YouTube
        </button>
      )}

      {(adding || editing) && (
        <VideoForm
          video={editing}
          topics={topics}
          isPending={pending}
          error={error}
          onSave={(data) => {
            setError(null);
            startTransition(async () => {
              const r = await saveVideoAction(data);
              if (r.error) { setError(r.error); return; }
              setAdding(false); setEditing(null);
              refresh();
            });
          }}
          onCancel={() => { setAdding(false); setEditing(null); setError(null); }}
        />
      )}

      <ul className="flex flex-col gap-2">
        {videos.map((v) => (
          <li key={v.id} className={`rounded-xl p-3 ring-1 ${v.is_active ? "bg-white ring-ink/10" : "bg-ink/5 ring-ink/5 opacity-70"}`}>
            <div className="flex gap-3">
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                <Image src={v.thumbnail_url || youtubeThumbnail(v.youtube_id)} alt={v.title} fill sizes="112px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink line-clamp-1">{v.title}</p>
                <p className="mt-0.5 text-xs text-ink/55">
                  👁 {v.total_views} view · {v.unique_viewers} orang
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  <button onClick={() => { setEditing(v); setAdding(false); }} className="text-sky-600 hover:underline">Edit</button>
                  <button onClick={() => startTransition(async () => { await toggleVideoAction(v.id, !v.is_active); refresh(); })} className="text-ink/50 hover:underline">
                    {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => setStatsFor(statsFor === v.id ? null : v.id)} className="text-emerald-600 hover:underline">
                    {statsFor === v.id ? "Tutup statistik" : "Statistik"}
                  </button>
                  <button onClick={() => { if (confirm("Hapus video ini?")) startTransition(async () => { await deleteVideoAction(v.id); refresh(); }); }} className="text-rose-600 hover:underline">Hapus</button>
                </div>
              </div>
            </div>
            {statsFor === v.id && <StatsPanel videoId={v.id} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VideoForm({ video, topics, onSave, onCancel, isPending, error }: {
  video: Video | null;
  topics: Topic[];
  onSave: (d: { id?: string; title: string; description: string; url: string; category_slug: string | null; is_active: boolean }) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [title, setTitle] = useState(video?.title ?? "");
  const [description, setDescription] = useState(video?.description ?? "");
  const [url, setUrl] = useState(video ? `https://www.youtube.com/watch?v=${video.youtube_id}` : "");
  const [categorySlug, setCategorySlug] = useState<string | null>(video?.category_slug ?? null);
  const [isActive, setIsActive] = useState(video?.is_active ?? true);

  const previewId = extractYouTubeId(url);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{video ? "Edit video" : "Video baru"}</p>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Link YouTube</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
        {url && !previewId && <p className="text-[11px] text-rose-600">⚠️ Link belum valid</p>}
        {previewId && (
          <div className="relative mt-1 aspect-video w-full max-w-xs overflow-hidden rounded-lg">
            <Image src={youtubeThumbnail(previewId)} alt="preview" fill sizes="320px" className="object-cover" />
            <span className="absolute bottom-1 right-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">✓ Valid</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Judul</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul video" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Deskripsi <span className="font-normal text-ink/45">(opsional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Kategori <span className="font-normal text-ink/45">(opsional)</span></label>
        <select value={categorySlug ?? ""} onChange={(e) => setCategorySlug(e.target.value || null)} className="rounded-lg border border-ink/15 px-2 py-2 text-sm">
          <option value="">— Tanpa kategori —</option>
          {topics.map((t) => <option key={t.slug} value={t.slug}>{t.emoji ? t.emoji + " " : ""}{t.title}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-ink/80 ring-1 ring-ink/10">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        <span>{isActive ? "✅ Tampil ke pengguna" : "🔒 Disembunyikan"}</span>
      </label>

      {error && <p className="text-xs text-rose-700">⚠️ {error}</p>}

      <div className="flex gap-2">
        <button onClick={() => onSave({ id: video?.id, title, description, url, category_slug: categorySlug, is_active: isActive })} disabled={isPending || !title.trim() || !previewId} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {isPending ? "Menyimpan..." : "💾 Simpan"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">Batal</button>
      </div>
    </div>
  );
}

function StatsPanel({ videoId }: { videoId: string }) {
  const [rows, setRows] = useState<{ day: string; views: number; unique_viewers: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 86400000);
  const [from, setFrom] = useState(monthAgo.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const load = () => {
    setLoading(true);
    const toEnd = new Date(to); toEnd.setDate(toEnd.getDate() + 1);
    getVideoStatsAction({ videoId, fromISO: new Date(from).toISOString(), toISO: toEnd.toISOString() })
      .then((r) => setRows(r.rows))
      .finally(() => setLoading(false));
  };

  const totalViews = rows?.reduce((s, r) => s + Number(r.views), 0) ?? 0;
  const totalUnique = rows?.reduce((s, r) => s + Number(r.unique_viewers), 0) ?? 0;

  return (
    <div className="mt-3 rounded-lg bg-ink/5 p-3">
      <p className="text-[11px] font-semibold text-ink/70">Statistik view per periode (buat klaim)</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-ink/60">Dari<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 rounded border border-ink/15 px-1.5 py-1 text-xs" /></label>
        <label className="text-[11px] text-ink/60">Sampai<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 rounded border border-ink/15 px-1.5 py-1 text-xs" /></label>
        <button onClick={load} disabled={loading} className="rounded bg-sky-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">{loading ? "..." : "Tampilkan"}</button>
      </div>
      {rows && (
        <div className="mt-2">
          <p className="text-xs font-bold text-ink">Total: {totalViews} view · {totalUnique} orang (rentang dipilih)</p>
          {rows.length === 0 ? (
            <p className="mt-1 text-[11px] italic text-ink/50">Belum ada view di periode ini.</p>
          ) : (
            <table className="mt-1 w-full text-[11px]">
              <thead><tr className="text-ink/50"><td>Tanggal</td><td className="text-right">View</td><td className="text-right">Orang</td></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.day} className="border-t border-ink/8">
                    <td className="py-0.5">{new Date(r.day).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" })}</td>
                    <td className="text-right">{r.views}</td>
                    <td className="text-right">{r.unique_viewers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
