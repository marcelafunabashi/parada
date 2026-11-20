import type { L } from "@/i18n";

export type Level = "normal" | "warning" | "elevated";

export interface RangeDef {
  key: string;
  unit: string;
  min: number;
  max: number;
  /** ascending zone boundaries: [warnFrom, elevatedFrom]; values below lowWarn (optional) are also warning */
  warnFrom: number;
  elevatedFrom: number;
  lowWarn?: number;
  /** if true, lower values are worse (e.g. SpO2, visual acuity) */
  inverted?: boolean;
  label: L;
  normalText: L;
}

export const RANGES: Record<string, RangeDef> = {
  systolic: {
    key: "systolic", unit: "mmHg", min: 90, max: 180, warnFrom: 120, elevatedFrom: 140,
    label: { es: "Sistólica (alta)", en: "Systolic (top)" },
    normalText: { es: "Normal < 120", en: "Normal < 120" },
  },
  diastolic: {
    key: "diastolic", unit: "mmHg", min: 50, max: 110, warnFrom: 80, elevatedFrom: 90,
    label: { es: "Diastólica (baja)", en: "Diastolic (bottom)" },
    normalText: { es: "Normal < 80", en: "Normal < 80" },
  },
  glucose: {
    key: "glucose", unit: "mg/dL", min: 60, max: 200, warnFrom: 100, elevatedFrom: 126, lowWarn: 70,
    label: { es: "Glucosa en ayunas", en: "Fasting glucose" },
    normalText: { es: "Normal 70–99", en: "Normal 70–99" },
  },
  cholesterol: {
    key: "cholesterol", unit: "mg/dL", min: 120, max: 300, warnFrom: 200, elevatedFrom: 240,
    label: { es: "Colesterol total", en: "Total cholesterol" },
    normalText: { es: "Deseable < 200", en: "Desirable < 200" },
  },
  bmi: {
    key: "bmi", unit: "kg/m²", min: 15, max: 40, warnFrom: 25, elevatedFrom: 30, lowWarn: 18.5,
    label: { es: "Índice de masa corporal", en: "Body mass index" },
    normalText: { es: "Normal 18,5–24,9", en: "Normal 18.5–24.9" },
  },
  waist: {
    key: "waist", unit: "cm", min: 60, max: 120, warnFrom: 80, elevatedFrom: 88,
    label: { es: "Perímetro de cintura", en: "Waist circumference" },
    normalText: { es: "Mujer < 80 · Hombre < 94", en: "Women < 80 · Men < 94" },
  },
  spo2: {
    key: "spo2", unit: "%", min: 85, max: 100, warnFrom: 95, elevatedFrom: 92, inverted: true,
    label: { es: "Saturación de oxígeno", en: "Oxygen saturation" },
    normalText: { es: "Normal ≥ 95 %", en: "Normal ≥ 95%" },
  },
  vision: {
    key: "vision", unit: "", min: 0.3, max: 1.2, warnFrom: 1.0, elevatedFrom: 0.7, inverted: true,
    label: { es: "Agudeza visual (decimal)", en: "Visual acuity (decimal)" },
    normalText: { es: "Normal ≥ 1,0", en: "Normal ≥ 1.0" },
  },
};

/** Waist thresholds depend on sex. */
export function waistRange(sex: "F" | "M"): RangeDef {
  return sex === "F"
    ? RANGES.waist
    : { ...RANGES.waist, warnFrom: 94, elevatedFrom: 102 };
}

export function classify(def: RangeDef, v: number): Level {
  if (def.inverted) {
    if (v < def.elevatedFrom) return "elevated";
    if (v < def.warnFrom) return "warning";
    return "normal";
  }
  if (def.lowWarn !== undefined && v < def.lowWarn) return "warning";
  if (v >= def.elevatedFrom) return "elevated";
  if (v >= def.warnFrom) return "warning";
  return "normal";
}

export const LEVEL_LABEL: Record<Level, L> = {
  normal: { es: "Normal", en: "Normal" },
  warning: { es: "A vigilar", en: "Watch" },
  elevated: { es: "Elevado", en: "High" },
};

export const worst = (levels: Level[]): Level =>
  levels.includes("elevated") ? "elevated" : levels.includes("warning") ? "warning" : "normal";
