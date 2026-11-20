import type { L } from "@/i18n";
import type { TestId } from "./tests";

export const XP = { correct: 10, wrong: 3, dailyBonus: 5, readiness: 10, checkIn: 20 };

export type TierId = "none" | "bronze" | "silver" | "gold";
export const TIERS: { id: Exclude<TierId, "none">; min: number; name: L; color: string; perk: L; perkDesc: L }[] = [
  {
    id: "bronze", min: 40, color: "from-amber-700 to-orange-400",
    name: { es: "Pase Preventivo Bronce", en: "Bronze Preventive Pass" },
    perk: { es: "Insignia para tu empresa", en: "Badge for your employer" },
    perkDesc: {
      es: "Un distintivo verificable que demuestra a tu empresa que cuidas tu salud sin perder horas de turno.",
      en: "A verifiable badge that shows your employer you look after your health without losing shift hours.",
    },
  },
  {
    id: "silver", min: 100, color: "from-slate-500 to-slate-300",
    name: { es: "Pase Preventivo Plata", en: "Silver Preventive Pass" },
    perk: { es: "Pase Prioritario de Turno", en: "Shift Priority Pass" },
    perkDesc: {
      es: "Pasas al frente de la cola de la unidad móvil en tu próxima visita. Ideal si entras a trabajar en minutos.",
      en: "Skip to the front of the mobile unit queue on your next visit. Ideal when your shift starts in minutes.",
    },
  },
  {
    id: "gold", min: 180, color: "from-yellow-500 to-amber-300",
    name: { es: "Pase Preventivo Oro", en: "Gold Preventive Pass" },
    perk: { es: "Franja reservada a tu medida", en: "Reserved slot on your schedule" },
    perkDesc: {
      es: "Reserva 15 minutos fijos en cualquier parada, encajados entre tus turnos.",
      en: "Book a fixed 15-minute slot at any stop, fitted between your shifts.",
    },
  },
];

export function tierFor(xp: number) {
  let current: (typeof TIERS)[number] | null = null;
  for (const t of TIERS) if (xp >= t.min) current = t;
  const next = TIERS.find((t) => t.min > xp) ?? null;
  return { current, next };
}

export type BadgeId = "corazon" | "lince" | "turno" | "semana" | "primera";
export const BADGES: Record<BadgeId, { name: L; how: L; emoji: string; color: string }> = {
  corazon: {
    name: { es: "Corazón Castizo", en: "Castizo Heart" }, emoji: "❤️", color: "from-rose-500 to-pink-400",
    how: { es: "Acierta todas las preguntas de corazón.", en: "Get every heart question right." },
  },
  lince: {
    name: { es: "Ojos de Lince", en: "Lynx Eyes" }, emoji: "👁️", color: "from-violet-600 to-fuchsia-400",
    how: { es: "Acierta 3 preguntas de vista, conducción o piel.", en: "Get 3 eyes, driving or skin questions right." },
  },
  turno: {
    name: { es: "Turno Imbatible", en: "Unbeatable Shift" }, emoji: "💪", color: "from-orange-500 to-amber-400",
    how: { es: "Acierta todas las preguntas de turnos y cuerpo.", en: "Get every shifts & body question right." },
  },
  semana: {
    name: { es: "Semana Activa", en: "Active Week" }, emoji: "🔥", color: "from-red-500 to-orange-400",
    how: { es: "Juega 3 días seguidos.", en: "Play 3 days in a row." },
  },
  primera: {
    name: { es: "Primera Parada", en: "First Stop" }, emoji: "🚐", color: "from-emerald-500 to-teal-400",
    how: { es: "Haz check-in en una unidad móvil.", en: "Check in at a mobile unit." },
  },
};

/* ---------- Health Readiness Meter ---------- */
export type LastTest = "lt6m" | "1y" | "2y" | "unknown";
export type JobType = "screen" | "standing" | "physical" | "driving";
export type Symptom = "eyes" | "dizzy" | "back" | "none";

export const READINESS_Q = {
  last: {
    q: { es: "¿Cuántos meses hace de tu última analítica?", en: "How long since your last blood test?" },
    opts: [
      { id: "lt6m", emoji: "🗓️", label: { es: "< 6 meses", en: "< 6 months" } },
      { id: "1y", emoji: "📅", label: { es: "1 año", en: "1 year" } },
      { id: "2y", emoji: "⏳", label: { es: "+2 años", en: "2+ years" } },
      { id: "unknown", emoji: "🤷", label: { es: "¡Ni me acuerdo!", en: "Can't remember!" } },
    ] as { id: LastTest; emoji: string; label: L }[],
  },
  job: {
    q: { es: "¿Cuál es tu tipo de trabajo?", en: "What kind of work do you do?" },
    opts: [
      { id: "screen", emoji: "🖥️", label: { es: "Sentado frente a pantalla", en: "Seated at a screen" } },
      { id: "standing", emoji: "🍽️", label: { es: "De pie / hostelería", en: "On my feet / hospitality" } },
      { id: "physical", emoji: "📦", label: { es: "Esfuerzo físico / carga", en: "Physical work / lifting" } },
      { id: "driving", emoji: "🚚", label: { es: "Conducción / rutas", en: "Driving / routes" } },
    ] as { id: JobType; emoji: string; label: L }[],
  },
  symptom: {
    q: { es: "¿Sientes algún síntoma común?", en: "Any common symptoms?" },
    opts: [
      { id: "eyes", emoji: "👀", label: { es: "Fatiga visual", en: "Eye strain" } },
      { id: "dizzy", emoji: "💫", label: { es: "Mareos breves", en: "Brief dizziness" } },
      { id: "back", emoji: "🦴", label: { es: "Dolor lumbar", en: "Lower back pain" } },
      { id: "none", emoji: "👍", label: { es: "Nada", en: "None" } },
    ] as { id: Symptom; emoji: string; label: L }[],
  },
};

const BASE_PACK: Record<JobType, { name: L; tests: TestId[] }> = {
  screen: { name: { es: "Pack Pantalla", en: "Screen Pack" }, tests: ["vision", "bp", "bmi"] },
  standing: { name: { es: "Pack Hostelería", en: "Hospitality Pack" }, tests: ["bp", "glucose", "bmi"] },
  physical: { name: { es: "Pack Carga", en: "Heavy-Lifting Pack" }, tests: ["bp", "ecg", "bmi"] },
  driving: { name: { es: "Pack Conductor", en: "Driver Pack" }, tests: ["bp", "vision", "glucose"] },
};

export interface PackRecommendation {
  name: L;
  tests: TestId[];
  urgency: number; // 0–100
  reasons: L[];
}

export function recommendPack(last: LastTest, job: JobType, symptom: Symptom): PackRecommendation {
  const base = BASE_PACK[job];
  const tests = new Set<TestId>(base.tests);
  const reasons: L[] = [];
  let urgency = { lt6m: 15, "1y": 40, "2y": 70, unknown: 80 }[last];

  if (last === "2y" || last === "unknown") {
    tests.add("glucose");
    tests.add("cholesterol");
    reasons.push({ es: "Hace tiempo de tu última analítica: añadimos glucosa y colesterol.", en: "It's been a while since your last blood test: we added glucose and cholesterol." });
  }
  if (symptom === "eyes") {
    tests.add("vision");
    urgency += 8;
    reasons.push({ es: "La fatiga visual se revisa en 3 minutos con el optotipo digital.", en: "Eye strain can be checked in 3 minutes with the digital eye chart." });
  } else if (symptom === "dizzy") {
    tests.add("bp");
    tests.add("glucose");
    tests.add("ecg");
    urgency += 15;
    reasons.push({ es: "Los mareos pueden relacionarse con tensión, glucosa o ritmo cardiaco.", en: "Dizziness can relate to blood pressure, glucose or heart rhythm." });
  } else if (symptom === "back") {
    tests.add("bmi");
    urgency += 5;
    reasons.push({ es: "Para el dolor lumbar te daremos pautas posturales durante la visita.", en: "For lower back pain we'll give you posture tips during the visit." });
  }
  if (job === "driving") reasons.push({ es: "En rutas, la vista y la glucosa son clave para tu seguridad.", en: "On the road, vision and glucose are key to your safety." });
  if (job === "standing") reasons.push({ es: "Muchas horas de pie: vigilamos tensión y circulación.", en: "Long hours standing: we watch blood pressure and circulation." });
  if (job === "physical") reasons.push({ es: "El esfuerzo físico exige un corazón en forma: incluimos ECG.", en: "Physical work demands a fit heart: ECG included." });
  if (job === "screen") reasons.push({ es: "Mucho tiempo sentado: tensión e IMC son tu punto de partida.", en: "Lots of sitting: blood pressure and BMI are your baseline." });

  return { name: base.name, tests: [...tests], urgency: Math.min(100, urgency), reasons };
}
