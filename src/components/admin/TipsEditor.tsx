"use client";

import { useState, useTransition } from "react";
import { KategoriMultiSelect } from "@/components/admin/KategoriMultiSelect";
import { useRouter } from "next/navigation";
import {
  saveTopicAction,
  deleteTopicAction,
  saveTipAction,
  deleteTipAction,
} from "@/app/admin/games/edukasi/actions";

type Topic = {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  definition: string | null;
  sort_order: number;
  is_active: boolean;
};

type Tip = {
  id: string;
  topic_slug: string;
  topic_title: string;
  topic_emoji: string | null;
  tip_title: string;
  tip_content: string;
  sort_order: number;
  is_active: boolean;
};

type Category = { id: number; slug: string; name: string };
type TopicCategoryLink = { topic_slug: string; category_id: number };

export function TipsEditor({ topics, tips, topicCategoryLinks = [], categories = [] }: { 
  topics: Topic[]; 
  tips: Tip[]; 
  topicCategoryLinks?: TopicCategoryLink[];
  categories?: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openTopic, setOpenTopic] = useState<string | null>(topics[0]?.slug ?? null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [addingNewTopic, setAddingNewTopic] = useState(false);
  const [addingTipFor, setAddingTipFor] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => router.refresh();

  const getCategoryIdsForTopic = (slug: string) =>
    topicCategoryLinks.filter((l) => l.topic_slug === slug).map((l) => l.category_id);

  // ==== TOPIC HANDLERS ====
  const onSaveTopic = (data: { id?: string; slug: string; title: string; emoji: string; definition: string; sort_order: number; is_active: boolean; categoryIds?: number[] }) => {
    startTransition(async () => {
      const r = await saveTopicAction(data);
      if (r.error) setMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Topic tersimpan");
        setEditingTopic(null);
        setAddingNewTopic(false);
        refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  const onDeleteTopic = (id: string, title: string) => {
    if (!confirm(`Hapus topic "${title}" & semua tips di dalemnya? Ga bisa di-undo.`)) return;
    startTransition(async () => {
      const r = await deleteTopicAction(id);
      if (r.error) setMsg("⚠️ " + r.error);
      else { setMsg("✓ Topic dihapus"); refresh(); setTimeout(() => setMsg(null), 2000); }
    });
  };

  // ==== TIP HANDLERS ====
  const onSaveTip = (data: { id?: string; topic_slug: string; topic_title: string; topic_emoji: string; tip_title: string; tip_content: string; sort_order: number; is_active: boolean }) => {
    startTransition(async () => {
      const r = await saveTipAction(data);
      if (r.error) setMsg("⚠️ " + r.error);
      else {
        setMsg("✓ Tip tersimpan");
        setEditingTip(null);
        setAddingTipFor(null);
        refresh();
        setTimeout(() => setMsg(null), 2000);
      }
    });
  };

  const onDeleteTip = (id: string, title: string) => {
    if (!confirm(`Hapus tip "${title}"?`)) return;
    startTransition(async () => {
      const r = await deleteTipAction(id);
      if (r.error) setMsg("⚠️ " + r.error);
      else { setMsg("✓ Tip dihapus"); refresh(); setTimeout(() => setMsg(null), 2000); }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm ${msg.startsWith("⚠️") ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}>
          {msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/55">{topics.length} topic · {tips.length} tips</p>
        <button
          onClick={() => setAddingNewTopic(true)}
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white"
        >
          + Topic baru
        </button>
      </div>

      {addingNewTopic && (
        <TopicForm
          topic={null}
          categories={categories}
          initialCategoryIds={[]}
          onSave={onSaveTopic}
          onCancel={() => setAddingNewTopic(false)}
          isPending={isPending}
          nextSortOrder={topics.length + 1}
        />
      )}

      {topics.map((topic) => {
        const topicTips = tips.filter(t => t.topic_slug === topic.slug);
        const isOpen = openTopic === topic.slug;
        const isEditing = editingTopic?.id === topic.id;

        return (
          <section key={topic.id} className="rounded-2xl bg-white ring-1 ring-ink/10 overflow-hidden">
            {/* Topic header */}
            <button
              onClick={() => setOpenTopic(isOpen ? null : topic.slug)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-sky-50"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <span className="text-2xl">{topic.emoji ?? "📋"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{topic.title} {!topic.is_active && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">inactive</span>}</p>
                  <p className="truncate text-xs text-ink/55">{topicTips.length} tips · slug: {topic.slug}</p>
                </div>
              </div>
              <span className="text-ink/50">{isOpen ? "▼" : "▶"}</span>
            </button>

            {isOpen && (
              <div className="border-t border-ink/5 px-4 py-3 flex flex-col gap-3">
                {/* Topic actions */}
                {!isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setEditingTopic(topic)} className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
                      ✏️ Edit topic
                    </button>
                    <button onClick={() => onDeleteTopic(topic.id, topic.title)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                      🗑️ Hapus topic
                    </button>
                    <button onClick={() => setAddingTipFor(topic.slug)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      + Tip baru
                    </button>
                  </div>
                ) : (
                  <TopicForm
                    topic={topic}
                    categories={categories}
                    initialCategoryIds={getCategoryIdsForTopic(topic.slug)}
                    onSave={onSaveTopic}
                    onCancel={() => setEditingTopic(null)}
                    isPending={isPending}
                  />
                )}

                {/* Definition display */}
                {topic.definition && !isEditing && (
                  <div className="rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-ink/70 ring-1 ring-sky-100">
                    <p className="font-semibold uppercase tracking-wide text-sky-700 text-[10px] mb-1">Definition</p>
                    {topic.definition}
                  </div>
                )}

                {/* Add new tip form */}
                {addingTipFor === topic.slug && (
                  <TipForm
                    tip={null}
                    topic={topic}
                    onSave={onSaveTip}
                    onCancel={() => setAddingTipFor(null)}
                    isPending={isPending}
                    nextSortOrder={topicTips.length + 1}
                  />
                )}

                {/* Tips list */}
                {topicTips.map((tip) => (
                  <div key={tip.id} className="rounded-xl bg-ink/2 p-3 ring-1 ring-ink/5">
                    {editingTip?.id === tip.id ? (
                      <TipForm
                        tip={tip}
                        topic={topic}
                        onSave={onSaveTip}
                        onCancel={() => setEditingTip(null)}
                        isPending={isPending}
                      />
                    ) : (
                      <>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{tip.tip_title} {!tip.is_active && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">inactive</span>}</p>
                          <div className="flex shrink-0 gap-1">
                            <button onClick={() => setEditingTip(tip)} className="rounded bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700 ring-1 ring-sky-200">✏️</button>
                            <button onClick={() => onDeleteTip(tip.id, tip.tip_title)} className="rounded bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200">🗑️</button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink/70">{tip.tip_content}</p>
                        <p className="mt-1 text-[10px] text-ink/40">sort: {tip.sort_order}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ==== TOPIC FORM ====
function TopicForm({ topic, onSave, onCancel, isPending, categories = [], initialCategoryIds = [], nextSortOrder = 1 }: {
  topic: Topic | null;
  onSave: (data: { id?: string; slug: string; title: string; emoji: string; definition: string; sort_order: number; is_active: boolean; categoryIds?: number[] }) => void;
  categories?: Category[];
  initialCategoryIds?: number[];
  onCancel: () => void;
  isPending: boolean;
  nextSortOrder?: number;
}) {
  const [slug, setSlug] = useState(topic?.slug ?? "");
  const [title, setTitle] = useState(topic?.title ?? "");
  // slugTouched = true kalau user udah edit slug manual (override auto-sync).
  // Untuk edit existing topic, langsung true (slug udah ke-set, jangan overwrite saat title diubah).
  const [slugTouched, setSlugTouched] = useState(!!topic?.slug);
  const [emoji, setEmoji] = useState(topic?.emoji ?? "");
  const [definition, setDefinition] = useState(topic?.definition ?? "");
  const [sortOrder] = useState(topic?.sort_order ?? nextSortOrder);
  const [isActive, setIsActive] = useState(topic?.is_active ?? true);
  const [categoryIds, setCategoryIds] = useState<number[]>(initialCategoryIds);

  const submit = () => onSave({ id: topic?.id, slug, title, emoji, definition, sort_order: sortOrder, is_active: isActive, categoryIds });

  return (
    <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200 flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">{topic ? "Edit topik" : "Topik baru"}</p>

      {/* JUDUL */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Judul topik</label>
        <input
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            if (!slugTouched) setSlug(slugify(v));
          }}
          placeholder="mis. Overthinking, Cara Hadapi NPD"
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </div>

      {/* EMOJI quick-pick */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Ikon <span className="font-normal text-ink/45">(pilih satu, opsional)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_CHOICES.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em === emoji ? "" : em)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                emoji === em ? "bg-sky-500 ring-2 ring-sky-300" : "bg-white ring-1 ring-ink/10 hover:bg-sky-100"
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* PENJELASAN */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Penjelasan singkat <span className="font-normal text-ink/45">(opsional)</span></label>
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Apa itu [kondisi]? Penjelasan singkat yang gampang dimengerti pembaca..."
          rows={4}
          className="rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
      </div>

      {/* KATEGORI */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Kategori <span className="font-normal text-rose-500">(wajib pilih min. 1)</span></label>
        <KategoriMultiSelect
          categories={categories}
          selectedIds={categoryIds}
          onChange={setCategoryIds}
        />
      </div>

      {/* PUBLISH toggle — bahasa manusia */}
      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-ink/80 ring-1 ring-ink/10">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        <span>{isActive ? "✅ Tampil ke pengguna" : "🔒 Disembunyikan (draft)"}</span>
      </label>

      {/* ADVANCED — slug disembunyiin, cuma buka kalau perlu */}
      <details className="rounded-lg bg-white/60 ring-1 ring-ink/10">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-ink/50">⚙️ Pengaturan lanjutan (biasanya gak perlu diubah)</summary>
        <div className="border-t border-ink/8 px-3 py-2">
          <label className="text-[11px] text-ink/55">Alamat URL (otomatis dari judul)</label>
          <input
            value={slug}
            onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
            onBlur={(e) => setSlug(slugify(e.target.value))}
            placeholder="otomatis"
            className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-[10px] text-ink/40">flouwell.app/edukasi/{slug || "..."}</p>
        </div>
      </details>

      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={isPending} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {isPending ? "Menyimpan..." : "💾 Simpan topik"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">
          Batal
        </button>
      </div>
    </div>
  );
}

// Emoji pilihan umum buat topik mental health (Rey tinggal klik, gak usah ngetik)
const EMOJI_CHOICES = ["🧠","💭","😰","😢","😡","😴","🪞","💔","🌱","🤝","🛡️","💪","🌧️","☀️","🧩","❤️‍🩹","🆘","📌"];

// ==== SLUGIFY UTIL ====
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ==== TIP FORM ====
function TipForm({ tip, topic, onSave, onCancel, isPending, nextSortOrder = 1 }: {
  tip: Tip | null;
  topic: Topic;
  onSave: (data: { id?: string; topic_slug: string; topic_title: string; topic_emoji: string; tip_title: string; tip_content: string; sort_order: number; is_active: boolean }) => void;
  onCancel: () => void;
  isPending: boolean;
  nextSortOrder?: number;
}) {
  const [tipTitle, setTipTitle] = useState(tip?.tip_title ?? "");
  const [tipContent, setTipContent] = useState(tip?.tip_content ?? "");
  // Tip lama: pakai sort existing. Tip baru: auto = paling bawah (nextSortOrder).
  const [sortOrder] = useState(tip?.sort_order ?? nextSortOrder);
  const [isActive, setIsActive] = useState(tip?.is_active ?? true);

  const submit = () => onSave({
    id: tip?.id,
    topic_slug: topic.slug,
    topic_title: topic.title,
    topic_emoji: topic.emoji ?? "",
    tip_title: tipTitle,
    tip_content: tipContent,
    sort_order: sortOrder,
    is_active: isActive,
  });

  return (
    <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200 flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{tip ? "Edit artikel" : "Artikel baru"} di {topic.emoji} {topic.title}</p>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Judul artikel</label>
        <input value={tipTitle} onChange={(e) => setTipTitle(e.target.value)} placeholder="mis. Cara hadapi orang dengan NPD" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-ink/70">Isi artikel</label>
        <textarea value={tipContent} onChange={(e) => setTipContent(e.target.value)} placeholder="Tulis penjelasan yang actionable & gampang dimengerti pembaca..." rows={6} className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </div>
      <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-ink/80 ring-1 ring-ink/10">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
        <span>{isActive ? "✅ Tampil ke pengguna" : "🔒 Disembunyikan (draft)"}</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={isPending} className="flex-1 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {isPending ? "Menyimpan..." : "💾 Simpan artikel"}
        </button>
        <button onClick={onCancel} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink/70 ring-1 ring-ink/15">
          Batal
        </button>
      </div>
    </div>
  );
}
