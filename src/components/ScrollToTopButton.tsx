"use client";

import Logo from "@/components/Logo";

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
      <Logo />
    </button>
  );
}
