"use client";

import Image from "next/image";

export function ScrollToTopButton() {
  const handleScroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleScroll}
      className="flex items-center transition-opacity hover:opacity-70 cursor-pointer"
      title="Scroll ke atas"
    >
      <Image
        src="/logo-full.png"
        alt="Flouwell"
        width={160}
        height={53}
        priority
        className="h-7 w-auto"
      />
    </button>
  );
}
