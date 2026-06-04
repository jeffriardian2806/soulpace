import Link from "next/link";
import type { Category } from "@/core/entities/post";

// Link biasa: prefetch route ditangani otomatis oleh Next.js <Link>.
export function CategoryButton({
  category,
  isActive,
}: {
  category: Category;
  isActive: boolean;
}) {
  return (
    <Link
      href={`/feed?cat=${category.slug}`}
      className={`rounded-full px-3 py-1 text-xs flex-shrink-0 transition-colors ${
        isActive ? "bg-sky-500 text-white" : "glass text-ink/70 hover:bg-sky-100"
      }`}
    >
      {category.name}
    </Link>
  );
}
