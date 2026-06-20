"use client";

import { useState } from "react";

type Tip = { id: string; tip_title: string; tip_content: string };
type Topic = { slug: string; title: string; emoji: string | null; definition: string | null; tips: Tip[] };

export function EdukasiClient({ topics, initialTopic }: { topics: Topic[]; initialTopic: string | null }) {
  const [activeSlug, setActiveSlug] = useState<string>(
    initialTopic && topics.some(t => t.slug === initialTopic) ? initialTopic : (topics[0]?.slug ?? "")
  );

  const activeTopic = topics.find(t => t.slug === activeSlug);

  return (
    <>
      {/* Topic chip selector */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((t) => {
          const isActive = t.slug === activeSlug;
          return (
            <button
              key={t.slug}
              onClick={() => setActiveSlug(t.slug)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-sky-500 to-purple-500 text-white shadow-sm scale-[1.02]"
                  : "bg-white text-ink/75 ring-1 ring-ink/10 hover:bg-sky-50"
              }`}
            >
              {t.emoji && <span className="mr-1">{t.emoji}</span>}
              {t.title}
            </button>
          );
        })}
      </div>

      {activeTopic && (
        <div className="flex flex-col gap-3">
          {/* Definition box */}
          {activeTopic.definition && (
            <section className="rounded-2xl bg-gradient-to-br from-sky-50 to-purple-50 p-4 ring-1 ring-sky-100">
              <p className="text-xs uppercase tracking-wide text-sky-700">
                Apa itu {activeTopic.title}?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">
                {activeTopic.definition}
              </p>
            </section>
          )}

          {/* Tips list */}
          <p className="mt-2 text-xs uppercase tracking-wide text-ink/50">
            {activeTopic.emoji} Tips · {activeTopic.tips.length} actionable
          </p>
          {activeTopic.tips.map((tip, i) => (
            <section key={tip.id} className="glass rounded-2xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-sky-600">{i + 1}.</span>
                <h2 className="text-sm font-bold text-ink">{tip.tip_title}</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink/75">{tip.tip_content}</p>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
