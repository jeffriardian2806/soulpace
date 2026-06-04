"use client";

export function ScrollToTopButton() {
  const handleScroll = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleScroll}
      className="text-xl font-bold text-ink hover:text-sky-600 transition-colors cursor-pointer"
      title="Scroll ke atas"
    >
      Soulpace
    </button>
  );
}
