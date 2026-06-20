"use client";

import Link from "next/link";
import type { Contact, ProfessionalContact } from "@/app/safety-plan/actions";
import { TTSButton } from "@/components/voice/TTSButton";
import { spellPhoneForTTS } from "@/lib/voiceUtils";

type SafetyPlanData = {
  warning_signs: string[];
  internal_strategies: string[];
  distraction_contacts: Contact[];
  help_contacts: Contact[];
  professional_contacts: ProfessionalContact[];
  means_restriction: string[];
};

export function SafetyPlanView({ data, crisisMode = false }: { data: SafetyPlanData | null; crisisMode?: boolean }) {
  if (!data) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
        <p className="text-3xl">📋</p>
        <p className="mt-2 text-base font-bold text-ink">Daftar Aman belum diisi</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/70">
          Lo belum siapin emergency kit. Isi sekarang pas lagi tenang biar pas crisis udah ready.
        </p>
        <Link href="/safety-plan" className="mt-3 inline-block rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">
          Isi sekarang →
        </Link>
      </div>
    );
  }

  // Format phone for tel: link
  const telHref = (phone: string) => `tel:${phone.replace(/\s|-|ext\.?/gi, "")}`;

  // Build TTS texts (natural spoken version)
  const profTTS = () => {
    if (data.professional_contacts.length === 0) return "";
    const items = data.professional_contacts.map(c => `${c.name}, nomor ${spellPhoneForTTS(c.phone)}`).join(". ");
    return `Telepon profesional atau crisis line. ${items}.`;
  };
  const helpTTS = () => {
    if (data.help_contacts.length === 0) return "";
    const items = data.help_contacts.map(c => {
      const noteText = c.note ? `, ${c.note}` : "";
      return `${c.name}${noteText}, nomor ${spellPhoneForTTS(c.phone)}`;
    }).join(". ");
    return `Orang yang bisa lo minta tolong. ${items}.`;
  };
  const meansTTS = () => {
    if (data.means_restriction.length === 0) return "";
    return `Amankan diri dulu. ${data.means_restriction.join(". ")}.`;
  };
  const internalTTS = () => {
    if (data.internal_strategies.length === 0) return "";
    return `Hal yang lo udah tau bisa bantu. ${data.internal_strategies.join(". ")}.`;
  };
  const distractTTS = () => {
    if (data.distraction_contacts.length === 0) return "";
    const items = data.distraction_contacts.map(c => `${c.name}, nomor ${spellPhoneForTTS(c.phone)}`).join(". ");
    return `Orang yang bisa distract lo. ${items}.`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Crisis mode header — emphasis on action */}
      {crisisMode && (
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-5 text-white shadow-lg">
          <p className="text-3xl">🆘</p>
          <p className="mt-2 text-lg font-bold">Lo aman sekarang.</p>
          <p className="mt-1 text-sm leading-relaxed text-white/90">
            Lo udah siapin daftar ini di moment tenang. Ikutin step di bawah satu per satu. Ga perlu mikir — tinggal tap.
          </p>
          <p className="mt-2 text-[11px] text-white/75 italic">
            Mata blur baca? Tap 🔊 di tiap section, akan dibacain.
          </p>
        </div>
      )}

      {/* Section 5 (Professional) — TOP priority di crisis mode */}
      {crisisMode && data.professional_contacts.length > 0 && (
        <ViewSection emoji="🏥" title="Telepon profesional / crisis line" ttsText={profTTS()}>
          <div className="flex flex-col gap-2">
            {data.professional_contacts.map((c, i) => (
              <a key={i} href={telHref(c.phone)} className="flex items-center justify-between rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 active:bg-rose-100">
                <div>
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-ink/55">{c.type === "crisis_line" ? "Crisis Line" : c.type === "psikolog" ? "Psikolog" : c.type === "psikiater" ? "Psikiater" : c.type === "dokter" ? "Dokter" : "Profesional"}</p>
                </div>
                <span className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white">📞 {c.phone}</span>
              </a>
            ))}
          </div>
        </ViewSection>
      )}

      {/* Section 4 (Help) — di crisis mode prominent */}
      {crisisMode && data.help_contacts.length > 0 && (
        <ViewSection emoji="🤝" title="Telepon orang yang bisa lo minta tolong" ttsText={helpTTS()}>
          <div className="flex flex-col gap-2">
            {data.help_contacts.map((c, i) => (
              <a key={i} href={telHref(c.phone)} className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200 active:bg-emerald-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  {c.note && <p className="text-xs text-ink/55">{c.note}</p>}
                </div>
                <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white">📞 {c.phone}</span>
              </a>
            ))}
          </div>
        </ViewSection>
      )}

      {/* Section 6 (Means Restriction) — di crisis mode prominent */}
      {crisisMode && data.means_restriction.length > 0 && (
        <ViewSection emoji="🔒" title="Amankan diri dulu" ttsText={meansTTS()}>
          <ul className="flex flex-col gap-2">
            {data.means_restriction.map((s, i) => (
              <li key={i} className="rounded-xl bg-amber-50 p-3 text-sm text-ink/80 ring-1 ring-amber-200">
                ☐ {s}
              </li>
            ))}
          </ul>
        </ViewSection>
      )}

      {/* Section 2 (Internal Strategies) — di crisis mode */}
      {crisisMode && data.internal_strategies.length > 0 && (
        <ViewSection emoji="🛡️" title="Hal yang lo udah tau bisa bantu" ttsText={internalTTS()}>
          <ul className="flex flex-col gap-2">
            {data.internal_strategies.map((s, i) => (
              <li key={i} className="rounded-xl bg-sky-50 p-3 text-sm text-ink/80 ring-1 ring-sky-200">
                ☐ {s}
              </li>
            ))}
          </ul>
        </ViewSection>
      )}

      {/* Section 3 (Distraction) — di crisis mode */}
      {crisisMode && data.distraction_contacts.length > 0 && (
        <ViewSection emoji="👥" title="Orang yang bisa distract lo" ttsText={distractTTS()}>
          <div className="flex flex-col gap-2">
            {data.distraction_contacts.map((c, i) => (
              <a key={i} href={telHref(c.phone)} className="flex items-center justify-between rounded-xl bg-purple-50 p-3 ring-1 ring-purple-200 active:bg-purple-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  {c.note && <p className="text-xs text-ink/55">{c.note}</p>}
                </div>
                <span className="rounded-full bg-purple-500 px-4 py-2 text-xs font-semibold text-white">📞 {c.phone}</span>
              </a>
            ))}
          </div>
        </ViewSection>
      )}

      {/* === NON-CRISIS MODE: Show all sections in order === */}
      {!crisisMode && (
        <>
          {data.warning_signs.length > 0 && (
            <ViewSection emoji="🚨" title="Tanda peringatan">
              <ul className="flex flex-col gap-1.5">
                {data.warning_signs.map((s, i) => (
                  <li key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-ink/80 ring-1 ring-amber-100">• {s}</li>
                ))}
              </ul>
            </ViewSection>
          )}
          {data.internal_strategies.length > 0 && (
            <ViewSection emoji="🛡️" title="Hal yang bisa lo lakuin sendiri">
              <ul className="flex flex-col gap-1.5">
                {data.internal_strategies.map((s, i) => (
                  <li key={i} className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-ink/80 ring-1 ring-sky-100">• {s}</li>
                ))}
              </ul>
            </ViewSection>
          )}
          {data.distraction_contacts.length > 0 && (
            <ViewSection emoji="👥" title="Orang yang bisa distract">
              <div className="flex flex-col gap-2">
                {data.distraction_contacts.map((c, i) => (
                  <div key={i} className="rounded-xl bg-purple-50 p-3 ring-1 ring-purple-100">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink/55">{c.phone}{c.note ? ` · ${c.note}` : ""}</p>
                  </div>
                ))}
              </div>
            </ViewSection>
          )}
          {data.help_contacts.length > 0 && (
            <ViewSection emoji="🤝" title="Orang yang bisa minta tolong">
              <div className="flex flex-col gap-2">
                {data.help_contacts.map((c, i) => (
                  <div key={i} className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink/55">{c.phone}{c.note ? ` · ${c.note}` : ""}</p>
                  </div>
                ))}
              </div>
            </ViewSection>
          )}
          {data.professional_contacts.length > 0 && (
            <ViewSection emoji="🏥" title="Profesional & Crisis Line">
              <div className="flex flex-col gap-2">
                {data.professional_contacts.map((c, i) => (
                  <div key={i} className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-100">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="text-xs text-ink/55">{c.phone} · {c.type === "crisis_line" ? "Crisis Line" : c.type}</p>
                  </div>
                ))}
              </div>
            </ViewSection>
          )}
          {data.means_restriction.length > 0 && (
            <ViewSection emoji="🔒" title="Cara amankan diri">
              <ul className="flex flex-col gap-1.5">
                {data.means_restriction.map((s, i) => (
                  <li key={i} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-ink/80 ring-1 ring-emerald-100">• {s}</li>
                ))}
              </ul>
            </ViewSection>
          )}

          <div className="flex gap-2">
            <Link href="/safety-plan" className="flex-1 rounded-full bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white">
              ✏️ Edit Daftar Aman
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function ViewSection({ emoji, title, children, ttsText }: { emoji: string; title: string; children: React.ReactNode; ttsText?: string }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{emoji} {title}</p>
        {ttsText && <TTSButton text={ttsText} label="Dengerin" />}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
