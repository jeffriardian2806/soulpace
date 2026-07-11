import { getActiveEvents } from "@/lib/events/queries";
import { getUiTexts } from "@/lib/uiTexts";
import { EventBanner } from "./EventBanner";

export async function EventBannerSlot() {
  const [items, texts] = await Promise.all([
    getActiveEvents(),
    getUiTexts(["banner.event.cta"], { "banner.event.cta": "Lihat detail →" }),
  ]);
  if (items.length === 0) return null;
  return <EventBanner items={items.map((w) => ({
    id: w.id, title: w.title, price_text: w.price_text, event_date: w.event_date,
    category_label: w.category_label, category_emoji: w.category_emoji,
    cta: texts["banner.event.cta"],
  }))} />;
}
