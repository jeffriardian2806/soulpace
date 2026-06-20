import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { CrisisModeFAB } from "@/components/crisis-mode/CrisisModeFAB";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://soulpace.vercel.app"),
  title: { default: "Soulpace", template: "%s · Soulpace" },
  description: "Tempat melampiaskan beban, tanpa dihakimi. Kamu nggak sendirian.",
  applicationName: "Soulpace",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "Soulpace", statusBarStyle: "default" },
  // Default: JANGAN index apa pun (privasi curhat). Landing di-override jadi index.
  robots: { index: false, follow: true },
  // Verifikasi Google Search Console: isi token lewat env GOOGLE_SITE_VERIFICATION di Vercel.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  themeColor: "#0EA5E9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans">
        {children}
        <CrisisModeFAB />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
