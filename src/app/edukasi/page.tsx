import Link from "next/link";
import type { Metadata } from "next";
import { CRISIS_RESOURCE } from "@/core/crisisResources";
import { checkPremiumAccess } from "@/components/PremiumGate";

export const metadata: Metadata = {
  title: "Edukasi & Tips Kesehatan Mental — Soulpace",
  description:
    "Tips praktis buat menenangkan diri: teknik napas, grounding, relaksasi otot, meditasi singkat, dan kebiasaan harian yang bantu jaga kesehatan mental.",
  robots: { index: true, follow: true },
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink/75">{children}</div>
    </section>
  );
}

export default async function EdukasiPage() {
  const _blocked_ = await checkPremiumAccess("edukasi");
  if (_blocked_) return _blocked_;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-5 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Edukasi &amp; Tips</h1>
        <Link href="/feed" className="text-xs font-medium text-sky-600 underline">
          Kembali ke beranda
        </Link>
      </header>

      <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-relaxed text-ink/70">
        Tips di sini buat bantu kamu sehari-hari, <strong>bukan pengganti</strong> bantuan
        profesional. Kalau perasaan berat sampai ganggu aktivitas, sudah lebih dari dua minggu,
        atau muncul pikiran buat menyakiti diri, tolong cari bantuan profesional. Kamu bisa
        telepon <span className="font-semibold text-ink/85">{CRISIS_RESOURCE.phone}</span>{" "}
        (SEJIWA, gratis 24 jam) atau{" "}
        <a
          href={CRISIS_RESOURCE.url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-medium text-sky-600 underline"
        >
          healing119.id
        </a>
        .
      </div>

      <Link
        href="/skrining"
        className="glass flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-sky-100"
      >
        <span className="text-sm font-medium text-ink">
          Coba skrining kesehatan mental
          <span className="block text-xs font-normal text-ink/55">
            Cek gejala depresi &amp; kecemasan (PHQ-9 / GAD-7)
          </span>
        </span>
        <span className="text-sky-600">→</span>
      </Link>

      <Card title="Teknik Napas 4-7-8">
        <p>
          Dipakai pas mulai cemas atau susah tidur. Caranya: tarik napas lewat hidung
          4 detik, tahan 7 detik, buang pelan lewat mulut 8 detik. Ulang 4 kali.
        </p>
        <p>
          Versi lebih simpel (box breathing): tarik 4 detik, tahan 4, buang 4, tahan 4.
          Fokus ke hitungan, bukan ke pikiran.
        </p>
      </Card>

      <Card title="Grounding 5-4-3-2-1">
        <p>
          Pas panik atau pikiran ke mana-mana, bawa diri balik ke sekarang dengan
          menyebut: 5 benda yang kamu lihat, 4 yang bisa kamu sentuh, 3 suara yang
          kamu dengar, 2 bau yang tercium, 1 hal yang bisa kamu rasakan.
        </p>
      </Card>

      <Card title="Relaksasi Otot Progresif">
        <p>
          Tegangkan satu kelompok otot sekitar 5 detik, lalu lepasin dan rasain bedanya.
          Mulai dari telapak kaki, naik pelan-pelan ke betis, paha, perut, tangan, bahu,
          sampai wajah. Cocok buat ngelepas tegang sebelum tidur.
        </p>
      </Card>

      <Card title="Meditasi Singkat (5 menit)">
        <p>
          Duduk nyaman, tutup mata kalau mau. Arahin perhatian ke napas yang masuk dan
          keluar. Wajar banget kalau pikiran ngelantur. Begitu sadar, balikin pelan ke
          napas tanpa nyalahin diri. Lima menit aja udah cukup buat mulai.
        </p>
      </Card>

      <Card title="Kebiasaan Harian yang Bantu">
        <p>Hal kecil yang konsisten sering lebih ngefek daripada perubahan besar:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Tidur dan bangun di jam yang mirip tiap hari.</li>
          <li>Gerak ringan, sekadar jalan kaki pun bantu.</li>
          <li>Batasi scroll media sosial, apalagi sebelum tidur.</li>
          <li>Tulis isi kepala (journaling) atau curhat di Soulpace biar lega.</li>
          <li>Kena sinar matahari sebentar di pagi hari.</li>
          <li>Ngobrol sama orang yang kamu percaya, jangan dipendam sendiri.</li>
        </ul>
      </Card>

      <Card title="Kapan Sebaiknya ke Profesional">
        <p>
          Pertimbangin buat ngobrol sama psikolog atau psikiater kalau keluhan kamu
          ganggu kerja, sekolah, atau hubungan; bertahan lebih dari dua minggu; atau
          bikin kamu kepikiran nyakitin diri. Cari bantuan itu tanda kamu peduli sama
          diri sendiri, bukan tanda lemah.
        </p>
        <p>
          {CRISIS_RESOURCE.message} Telepon{" "}
          <span className="font-semibold text-ink/85">{CRISIS_RESOURCE.phone}</span>{" "}
          atau kunjungi{" "}
          <a
            href={CRISIS_RESOURCE.url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="font-medium text-sky-600 underline"
          >
            healing119.id
          </a>
          .
        </p>
      </Card>

      <p className="pb-4 text-center text-xs text-ink/40">
        Sumber teknik: pendekatan umum CBT &amp; mindfulness. Selalu sesuaikan dengan
        kondisimu, dan konsultasi ke profesional bila perlu.
      </p>
    </main>
  );
}
