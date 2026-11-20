import type { L } from "@/i18n";

export type TestId = "bp" | "glucose" | "cholesterol" | "bmi" | "vision" | "ecg" | "mole" | "spo2" | "hearing";

export interface TestDef {
  id: TestId;
  name: L;
  short: L;
  minutes: number;
  fasting: boolean;
  prep: L;
}

export const TESTS: Record<TestId, TestDef> = {
  bp: {
    id: "bp", minutes: 3, fasting: false,
    name: { es: "Tensión arterial", en: "Blood pressure" },
    short: { es: "Tensión", en: "Blood pressure" },
    prep: { es: "Evita café y tabaco 30 min antes.", en: "Avoid coffee and smoking 30 min before." },
  },
  glucose: {
    id: "glucose", minutes: 4, fasting: true,
    name: { es: "Glucosa en sangre", en: "Blood glucose" },
    short: { es: "Glucosa", en: "Glucose" },
    prep: { es: "Ideal en ayunas de 8 h (agua sí).", en: "Best after an 8-hour fast (water is fine)." },
  },
  cholesterol: {
    id: "cholesterol", minutes: 4, fasting: true,
    name: { es: "Colesterol total", en: "Total cholesterol" },
    short: { es: "Colesterol", en: "Cholesterol" },
    prep: { es: "Mejor en ayunas; agua permitida.", en: "Best fasting; water allowed." },
  },
  bmi: {
    id: "bmi", minutes: 2, fasting: false,
    name: { es: "IMC y perímetro de cintura", en: "BMI & waist" },
    short: { es: "IMC + cintura", en: "BMI + waist" },
    prep: { es: "Sin preparación.", en: "No preparation needed." },
  },
  vision: {
    id: "vision", minutes: 3, fasting: false,
    name: { es: "Agudeza visual", en: "Visual acuity" },
    short: { es: "Visión", en: "Vision" },
    prep: { es: "Trae tus gafas o lentillas.", en: "Bring your glasses or contacts." },
  },
  ecg: {
    id: "ecg", minutes: 5, fasting: false,
    name: { es: "Electrocardiograma (ECG)", en: "Electrocardiogram (ECG)" },
    short: { es: "ECG", en: "ECG" },
    prep: { es: "Ropa que permita acceder al pecho.", en: "Wear clothing that gives chest access." },
  },
  mole: {
    id: "mole", minutes: 4, fasting: false,
    name: { es: "Revisión de lunares", en: "Mole screening" },
    short: { es: "Lunares", en: "Moles" },
    prep: { es: "Sin crema en la zona a revisar.", en: "No cream on the area to check." },
  },
  spo2: {
    id: "spo2", minutes: 1, fasting: false,
    name: { es: "Saturación de oxígeno", en: "Oxygen saturation" },
    short: { es: "SpO₂", en: "SpO₂" },
    prep: { es: "Sin esmalte de uñas en un dedo.", en: "No nail polish on one finger." },
  },
  hearing: {
    id: "hearing", minutes: 4, fasting: false,
    name: { es: "Audiometría rápida", en: "Quick hearing test" },
    short: { es: "Audición", en: "Hearing" },
    prep: { es: "Evita ruidos fuertes 1 h antes.", en: "Avoid loud noise 1 h before." },
  },
};

export const ALL_TESTS = Object.keys(TESTS) as TestId[];

export const totalMinutes = (ids: TestId[]) => ids.reduce((acc, id) => acc + TESTS[id].minutes, 0) + 3; // +3 check-in / exit
