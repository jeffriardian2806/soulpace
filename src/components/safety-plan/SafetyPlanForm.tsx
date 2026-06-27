"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSafetyPlanAction, type Contact, type ProfessionalContact } from "@/app/safety-plan/actions";

type Props = {
  initialData?: {
    warning_signs?: string[];
    internal_strategies?: string[];
    distraction_contacts?: Contact[];
    help_contacts?: Contact[];
    professional_contacts?: ProfessionalContact[];
    means_restriction?: string[];
    is_complete?: boolean;
  };
};

const DEFAULT_PROFESSIONALS: ProfessionalContact[] = [
  { name: "SEJIWA", phone: "119 ext 8", type: "crisis_line" },
  { name: "Halo Kemenkes", phone: "1500-567", type: "crisis_line" },
];

export function SafetyPlanForm({ initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [warningSigns, setWarningSigns] = useState<string[]>(initialData?.warning_signs?.length ? initialData.warning_signs : [""]);
  const [internalStrategies, setInternalStrategies] = useState<string[]>(initialData?.internal_strategies?.length ? initialData.internal_strategies : [""]);
  const [distractionContacts, setDistractionContacts] = useState<Contact[]>(initialData?.distraction_contacts?.length ? initialData.distraction_contacts : [{ name: "", phone: "" }]);
  const [helpContacts, setHelpContacts] = useState<Contact[]>(initialData?.help_contacts?.length ? initialData.help_contacts : [{ name: "", phone: "" }]);
  const [professionalContacts, setProfessionalContacts] = useState<ProfessionalContact[]>(initialData?.professional_contacts?.length ? initialData.professional_contacts : DEFAULT_PROFESSIONALS);
  const [meansRestriction, setMeansRestriction] = useState<string[]>(initialData?.means_restriction?.length ? initialData.means_restriction : [""]);

  // === Generic array handlers ===
  const updateStrAt = (arr: string[], setArr: (a: string[]) => void) => (i: number, v: string) => {
    const next = [...arr]; next[i] = v; setArr(next);
  };
  const addStr = (arr: string[], setArr: (a: string[]) => void) => () => setArr([...arr, ""]);
  const removeAt = <T,>(arr: T[], setArr: (a: T[]) => void) => (i: number) => {
    const next = arr.filter((_, idx) => idx !== i);
    setArr(next.length > 0 ? next : ([typeof arr[0] === "string" ? "" : { name: "", phone: "" }] as unknown as T[]));
  };

  const updateContact = (arr: Contact[], setArr: (a: Contact[]) => void) => (i: number, field: keyof Contact, v: string) => {
    const next = [...arr]; next[i] = { ...next[i], [field]: v }; setArr(next);
  };
  const addContact = (arr: Contact[], setArr: (a: Contact[]) => void) => () => setArr([...arr, { name: "", phone: "" }]);

  const updateProfContact = (i: number, field: keyof ProfessionalContact, v: string) => {
    const next = [...professionalContacts]; next[i] = { ...next[i], [field]: v }; setProfessionalContacts(next);
  };
  const addProfContact = () => setProfessionalContacts([...professionalContacts, { name: "", phone: "", type: "psikolog" }]);

  // === Submit ===
  const handleSave = (markComplete: boolean) => {
    setSaveStatus("idle");
    setErrMsg(null);
    startTransition(async () => {
      const result = await saveSafetyPlanAction({
        warning_signs: warningSigns,
        internal_strategies: internalStrategies,
        distraction_contacts: distractionContacts,
        help_contacts: helpContacts,
        professional_contacts: professionalContacts,
        means_restriction: meansRestriction,
        is_complete: markComplete,
      });
      if (result.error) {
        setSaveStatus("error");
        setErrMsg(result.error);
      } else {
        setSaveStatus("saved");
        if (markComplete) {
          setTimeout(() => router.push("/safety-plan/crisis"), 800);
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Intro */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 p-4 ring-1 ring-emerald-200">
        <p className="text-xs uppercase tracking-wide text-emerald-700">📋 Catatan penting</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">
          Isi pas lo lagi <strong>tenang</strong>, jangan pas crisis. Ini bukan terapi — ini <strong>emergency kit</strong> yang lo siapin buat diri sendiri dari moment stable. Pas crisis nanti, tinggal buka & tap. Ga perlu mikir lagi.
        </p>
        <p className="mt-2 text-[10px] italic text-ink/55">
          Data ini private. Cuma lo yang bisa lihat. Bukan moderator, bukan admin, bukan Flouwell.
        </p>
      </div>

      {/* Section 1: Warning Signs */}
      <Section
        number={1}
        emoji="🚨"
        title="Tanda Peringatan"
        helper="Gimana lo tau lo lagi mulai ga okay? Pikiran, perasaan, situasi, atau perilaku yang biasanya muncul sebelum crisis."
        examples="Contoh: 'Gw mulai isolate dari semua orang', 'Pikiran gw mulai gelap pas malam', 'Pas gw skip makan 2 hari'"
      >
        <ArrayStringInput
          items={warningSigns}
          onUpdate={updateStrAt(warningSigns, setWarningSigns)}
          onAdd={addStr(warningSigns, setWarningSigns)}
          onRemove={removeAt(warningSigns, setWarningSigns)}
          placeholder="Tanda peringatan..."
        />
      </Section>

      {/* Section 2: Internal Strategies */}
      <Section
        number={2}
        emoji="🛡️"
        title="Hal Yang Bisa Gw Lakuin Sendiri"
        helper="Aktivitas yang biasanya bantu lo turun emosi tanpa perlu kontak orang lain. Yang lo udah tau dari pengalaman lo sendiri — bisa kerja."
        examples="Contoh: 'Mandi air anget', 'Nulis di journal', 'Main game ringan', 'Putar lagu X', 'Olahraga 15 menit'"
      >
        <ArrayStringInput
          items={internalStrategies}
          onUpdate={updateStrAt(internalStrategies, setInternalStrategies)}
          onAdd={addStr(internalStrategies, setInternalStrategies)}
          onRemove={removeAt(internalStrategies, setInternalStrategies)}
          placeholder="Aktivitas..."
        />
      </Section>

      {/* Section 3: Distraction Contacts */}
      <Section
        number={3}
        emoji="👥"
        title="Orang Yang Bisa Distract Gw"
        helper="Orang yang lo bisa hubungin BUKAN buat ngomongin masalah, tapi cuma buat distract — nonton bareng, ngobrol random, hangout."
        examples="Beda dari Section 4. Yang ini cuma buat alihin pikiran sebentar."
      >
        <ArrayContactInput
          items={distractionContacts}
          onUpdate={updateContact(distractionContacts, setDistractionContacts)}
          onAdd={addContact(distractionContacts, setDistractionContacts)}
          onRemove={removeAt(distractionContacts, setDistractionContacts)}
        />
      </Section>

      {/* Section 4: Help Contacts */}
      <Section
        number={4}
        emoji="🤝"
        title="Orang Yang Gw Bisa Minta Tolong"
        helper="Orang yang lo trust buat actually nge-ungkapin lo lagi ga okay & minta support. Yang udah pernah ngebantu lo sebelumnya."
        examples="Contoh: bokap/nyokap/abang, sahabat dekat, partner, dosen/mentor yang lo trust"
      >
        <ArrayContactInput
          items={helpContacts}
          onUpdate={updateContact(helpContacts, setHelpContacts)}
          onAdd={addContact(helpContacts, setHelpContacts)}
          onRemove={removeAt(helpContacts, setHelpContacts)}
        />
      </Section>

      {/* Section 5: Professional Contacts */}
      <Section
        number={5}
        emoji="🏥"
        title="Profesional & Crisis Line"
        helper="Nomor psikolog/psikiater lo (kalau ada), plus crisis line yang udah disediain default. Tinggal tap pas butuh."
        examples="SEJIWA & Halo Kemenkes default udah diisi. Tambahin profesional lo sendiri kalau ada."
      >
        <div className="flex flex-col gap-2">
          {professionalContacts.map((c, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-ink/10">
              <div className="flex gap-2">
                <input value={c.name} onChange={(e) => updateProfContact(i, "name", e.target.value)} placeholder="Nama" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
                <select value={c.type} onChange={(e) => updateProfContact(i, "type", e.target.value)} className="rounded-lg border border-ink/15 px-2 py-2 text-xs">
                  <option value="crisis_line">Crisis Line</option>
                  <option value="psikolog">Psikolog</option>
                  <option value="psikiater">Psikiater</option>
                  <option value="dokter">Dokter</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input value={c.phone} onChange={(e) => updateProfContact(i, "phone", e.target.value)} placeholder="Nomor telepon" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" inputMode="tel" />
                <button onClick={() => setProfessionalContacts(professionalContacts.filter((_, idx) => idx !== i))} className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-200">×</button>
              </div>
            </div>
          ))}
          <button onClick={addProfContact} className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-200">+ Tambah profesional</button>
        </div>
      </Section>

      {/* Section 6: Means Restriction */}
      <Section
        number={6}
        emoji="🔒"
        title="Cara Amankan Diri"
        helper="Komitmen ke diri sendiri buat batasin akses ke hal-hal berbahaya pas lo lagi ga okay. Lo decide & write."
        examples="Contoh: 'Pisau dapur dipindahin ke laci yg dikunci', 'Obat-obatan disimpan di rumah ortu', 'HP di-handover ke partner kalau gw mulai ga okay'"
      >
        <ArrayStringInput
          items={meansRestriction}
          onUpdate={updateStrAt(meansRestriction, setMeansRestriction)}
          onAdd={addStr(meansRestriction, setMeansRestriction)}
          onRemove={removeAt(meansRestriction, setMeansRestriction)}
          placeholder="Cara amankan diri..."
        />
      </Section>

      {/* Save buttons */}
      <div className="sticky bottom-0 -mx-5 border-t border-ink/10 bg-white/95 px-5 py-3 backdrop-blur-sm">
        {saveStatus === "saved" && (
          <p className="mb-2 text-center text-xs text-emerald-600">✓ Tersimpan</p>
        )}
        {saveStatus === "error" && (
          <p className="mb-2 text-center text-xs text-rose-600">⚠️ {errMsg ?? "Gagal simpan"}</p>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-medium text-ink/70 ring-1 ring-sky-200 disabled:opacity-50"
          >
            💾 Simpan draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            ✓ Selesai & lihat
          </button>
        </div>
      </div>
    </div>
  );
}

// === Sub-components ===
function Section({ number, emoji, title, helper, examples, children }: { number: number; emoji: string; title: string; helper: string; examples: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-ink/50">Section {number}</p>
        <p className="mt-1 text-base font-bold text-ink">{emoji} {title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/65">{helper}</p>
        <p className="mt-1 text-[10px] italic leading-relaxed text-ink/45">{examples}</p>
      </div>
      {children}
    </section>
  );
}

function ArrayStringInput({ items, onUpdate, onAdd, onRemove, placeholder }: { items: string[]; onUpdate: (i: number, v: string) => void; onAdd: () => void; onRemove: (i: number) => void; placeholder: string }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item} onChange={(e) => onUpdate(i, e.target.value)} placeholder={placeholder} className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          <button onClick={() => onRemove(i)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-200">×</button>
        </div>
      ))}
      <button onClick={onAdd} className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-200">+ Tambah</button>
    </div>
  );
}

function ArrayContactInput({ items, onUpdate, onAdd, onRemove }: { items: Contact[]; onUpdate: (i: number, field: keyof Contact, v: string) => void; onAdd: () => void; onRemove: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((c, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <input value={c.name} onChange={(e) => onUpdate(i, "name", e.target.value)} placeholder="Nama" className="rounded-lg border border-ink/15 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input value={c.phone} onChange={(e) => onUpdate(i, "phone", e.target.value)} placeholder="Nomor telepon" className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm" inputMode="tel" />
            <button onClick={() => onRemove(i)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 ring-1 ring-rose-200">×</button>
          </div>
          <input value={c.note ?? ""} onChange={(e) => onUpdate(i, "note", e.target.value)} placeholder="Catatan (optional, mis. 'sahabat sma')" className="rounded-lg border border-ink/15 px-3 py-2 text-xs" />
        </div>
      ))}
      <button onClick={onAdd} className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 ring-1 ring-sky-200">+ Tambah orang</button>
    </div>
  );
}
