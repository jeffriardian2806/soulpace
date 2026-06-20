export type InstrumentPayload = {
  id?: string;
  slug: string;
  name: string;
  subtitle: string;
  prompt: string;
  crisisItemPosition: number | null;
  isActive: boolean;
  sortOrder: number;
  options: { label: string; value: number }[];
  items: { text: string; reverse: boolean }[];
  bands: { min: number; max: number; label: string; advice: string }[];
  categoryIds: number[];
};
