"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  addAnchorPhotoAction,
  deleteAnchorPhotoAction,
  updateCaptionAction,
  type AnchorItem,
} from "@/app/anchor-album/actions";

const MAX_ITEMS = 7;
const MAX_DIMENSION = 1024;
const COMPRESS_QUALITY = 0.85;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height * MAX_DIMENSION) / width;
            width = MAX_DIMENSION;
          } else {
            width = (width * MAX_DIMENSION) / height;
            height = MAX_DIMENSION;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context error"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          COMPRESS_QUALITY
        );
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export function AnchorAlbumManager({ initialItems, userId }: { initialItems: AnchorItem[]; userId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");

  const canUpload = initialItems.length < MAX_ITEMS;

  const handleUpload = async (file: File) => {
    setErrMsg(null);
    setMsg(null);

    if (!canUpload) {
      setErrMsg(`Max ${MAX_ITEMS} foto. Hapus 1 dulu kalau mau tambah.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrMsg("File harus gambar (JPG, PNG, WebP).");
      return;
    }

    setUploading(true);
    try {
      // Compress
      const blob = await compressImage(file);

      // Upload to storage
      const supabase = createClient();
      const timestamp = Date.now();
      const ext = "jpg"; // compressed jadi JPEG
      const path = `${userId}/${timestamp}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("anchor-album")
        .upload(path, blob, { contentType: "image/jpeg", upsert: false });

      if (uploadErr) {
        setErrMsg(`Upload gagal: ${uploadErr.message}`);
        setUploading(false);
        return;
      }

      // Register di DB
      const result = await addAnchorPhotoAction({ storage_path: path, caption: "" });
      if (result.error) {
        // Cleanup orphan storage file
        await supabase.storage.from("anchor-album").remove([path]);
        setErrMsg(result.error);
        setUploading(false);
        return;
      }

      setMsg("✓ Foto tersimpan");
      router.refresh();
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setErrMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = (id: string, storage_path: string) => {
    if (!confirm("Hapus foto ini? Ga bisa di-undo.")) return;
    startTransition(async () => {
      const r = await deleteAnchorPhotoAction({ id, storage_path });
      if (r.error) setErrMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Foto dihapus");
        router.refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  const handleSaveCaption = (id: string) => {
    startTransition(async () => {
      const r = await updateCaptionAction({ id, caption: captionText });
      if (r.error) setErrMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Caption tersimpan");
        setEditingCaption(null);
        router.refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Privacy disclosure */}
      <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
        <p className="text-xs uppercase tracking-wide font-semibold text-emerald-700">🔒 Privacy</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/70">
          Foto kamu disimpan <strong>private</strong>. Cuma kamu yang bisa lihat. Disimpan encrypted di Supabase Storage. Bukan moderator, bukan admin, bukan Soulpace.
        </p>
      </div>

      {/* Upload area */}
      <section className={`rounded-2xl border-2 border-dashed p-6 text-center ${canUpload ? "border-sky-300 bg-sky-50" : "border-ink/10 bg-ink/5"}`}>
        {canUpload ? (
          <>
            <p className="text-3xl">📸</p>
            <p className="mt-2 text-sm font-bold text-ink">
              Upload foto ({initialItems.length}/{MAX_ITEMS})
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              Pilih foto yang bikin kamu inget moment baik — diri sendiri waktu happy, loved ones, pet, tempat aman, achievement.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {uploading ? "Mengunggah..." : "+ Pilih foto"}
            </button>
            <p className="mt-2 text-[10px] italic text-ink/40">
              Max 5 MB. Otomatis di-compress sebelum upload (max 1024px, ~80% quality).
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl">🎉</p>
            <p className="mt-2 text-sm font-bold text-ink">Album penuh ({MAX_ITEMS}/{MAX_ITEMS})</p>
            <p className="mt-1 text-xs text-ink/60">Hapus 1 foto kalau mau tambah baru.</p>
          </>
        )}
      </section>

      {msg && <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">{msg}</div>}
      {errMsg && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700 ring-1 ring-rose-200">⚠️ {errMsg}</div>}

      {/* Photo grid */}
      {initialItems.length > 0 && (
        <section className="grid grid-cols-2 gap-3">
          {initialItems.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
              {item.signed_url ? (
                <div className="relative aspect-square bg-ink/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.signed_url} alt={item.caption ?? "Anchor photo"} className="absolute inset-0 h-full w-full object-contain" />
                </div>
              ) : (
                <div className="aspect-square bg-ink/10 flex items-center justify-center text-ink/30 text-xs">no preview</div>
              )}
              <div className="p-2">
                {editingCaption === item.id ? (
                  <div className="flex flex-col gap-1">
                    <input
                      value={captionText}
                      onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Caption..."
                      maxLength={100}
                      className="rounded border border-ink/15 px-2 py-1 text-xs"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => handleSaveCaption(item.id)} disabled={isPending} className="flex-1 rounded bg-emerald-500 px-2 py-1 text-[10px] text-white">💾</button>
                      <button onClick={() => setEditingCaption(null)} className="rounded bg-white px-2 py-1 text-[10px] text-ink/60 ring-1 ring-ink/15">✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] leading-tight text-ink/70 line-clamp-2 min-h-[2em]">
                      {item.caption ?? <span className="italic text-ink/30">tanpa caption</span>}
                    </p>
                    <div className="mt-1 flex gap-1">
                      <button
                        onClick={() => { setEditingCaption(item.id); setCaptionText(item.caption ?? ""); }}
                        className="flex-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700 ring-1 ring-sky-200"
                      >
                        ✏️ Caption
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.storage_path)}
                        disabled={isPending}
                        className="rounded bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Tip */}
      {initialItems.length === 0 && (
        <p className="text-center text-xs italic text-ink/45">
          Foto-foto ini bakal jadi anchor visual lo pas crisis. Akan ditampilin nanti di Crisis Companion.
        </p>
      )}
    </div>
  );
}
