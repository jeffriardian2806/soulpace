"use client";

import Link from "next/link";
import { prefetchFeedCategory } from "@/app/feed/actions";
import type { Category } from "@/core/entities/post";

interface CategoryButtonProps {
  category: Category;
  isActive: boolean;
  currentCat?: string;
}

export function CategoryButton({
  category,
  isActive,
  currentCat,
}: CategoryButtonProps) {
  // Prefetch data on hover (background, no-op if already cached)
  const handleMouseEnter = async () => {
    await prefetchFeedCategory(category.slug);
  };

  return (
    <Link
      href={`/feed?cat=${category.slug}`}
      onMouseEnter={handleMouseEnter}
      className={`rounded-full px-3 py-1 text-xs flex-shrink-0 transition-colors ${
        currentCat === category.slug
          ? "bg-sky-500 text-white"
          : "glass text-ink/70 hover:bg-sky-100"
      }`}
    >
      {category.name}
    </Link>
  );
}
