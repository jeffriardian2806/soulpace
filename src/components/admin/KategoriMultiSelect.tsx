"use client";

type Category = { id: number; slug: string; name: string };

export function KategoriMultiSelect({
  categories,
  selectedIds,
  onChange,
  label = "Kategori (untuk Konsultasi flow)",
  hint = "Centang kategori yang relevan. Bisa lebih dari 1. Tampil di /konsultasi/sesi-baru/[kategori] sesuai centangan.",
}: {
  categories: Category[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  hint?: string;
}) {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="rounded-xl bg-sky-50/60 p-3 ring-1 ring-sky-100">
      <p className="text-xs font-semibold text-ink/85">{label}</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ink/55">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((c) => {
          const active = selectedIds.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                active
                  ? "bg-sky-500 text-white ring-sky-500"
                  : "bg-white text-ink/70 ring-ink/15 hover:bg-sky-50"
              }`}
            >
              {active ? "✓ " : ""}{c.name}
            </button>
          );
        })}
      </div>
      {selectedIds.length === 0 && (
        <p className="mt-2 text-[10px] italic text-amber-700">
          ⚠️ Belum ada kategori dipilih — data ini gak akan muncul di Konsultasi flow.
        </p>
      )}
    </div>
  );
}
