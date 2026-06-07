// Tipe skenario empati. DATA sekarang di DB (tabel empathy_scenarios).
export interface EmpathyOption { text: string; safe: boolean; feedback: string }
export interface EmpathyScenario {
  id: string;
  topic: string;
  situation: string;
  options: EmpathyOption[];
}
