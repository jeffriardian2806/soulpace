import { QuietRoom } from "@/components/QuietRoom";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata = {
  title: "Ruang Hening — Soulpace",
  description: "Ruang untuk diam sejenak. Nggak harus cerita, cukup hadir.",
};

export default async function HeningPage() {
  const _blocked_ = await checkPremiumAccess("hening");
  if (_blocked_) return _blocked_;

  return <QuietRoom />;
}
