import { getActiveWorkshops } from "@/lib/workshops/queries";
import { getUiTexts } from "@/lib/uiTexts";
import { WorkshopBanner } from "./WorkshopBanner";

export async function WorkshopBannerSlot() {
  const [workshops, texts] = await Promise.all([
    getActiveWorkshops(),
    getUiTexts(["banner.workshop.badge", "banner.workshop.cta"], {
      "banner.workshop.badge": "🎓 EVENT BARU",
      "banner.workshop.cta": "Lihat detail →",
    }),
  ]);
  if (workshops.length === 0) return null;
  return <WorkshopBanner workshops={workshops.map((w) => ({ id: w.id, title: w.title, price_text: w.price_text, event_date: w.event_date, badge: texts["banner.workshop.badge"], cta: texts["banner.workshop.cta"] }))} />;
}
