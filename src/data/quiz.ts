import type { L } from "@/i18n";

export type QuizCategory = "heart" | "eyes" | "shift" | "metabolic" | "skin";

export interface QuizCard {
  id: string;
  category: QuizCategory;
  emoji: string;
  question: L;
  options: { id: string; label: L }[];
  correct: string;
  why: L;
}

const MV = [
  { id: "myth", label: { es: "Mito", en: "Myth" } },
  { id: "fact", label: { es: "Verdad", en: "Fact" } },
];

export const QUIZ: QuizCard[] = [
  {
    id: "coffee-bp", category: "heart", emoji: "☕",
    question: { es: "¿El café de la mañana altera la prueba de tensión arterial?", en: "Can your morning coffee change a blood pressure reading?" },
    options: MV, correct: "fact",
    why: {
      es: "La cafeína puede subir la tensión durante un rato tras tomarla. Por eso te pedimos esperar unos 30 minutos desde el último café antes de medirla.",
      en: "Caffeine can raise blood pressure for a while after you drink it. That's why we ask you to wait about 30 minutes after your last coffee before measuring.",
    },
  },
  {
    id: "fasting-glucose", category: "metabolic", emoji: "🍞",
    question: { es: "¿Tengo que venir en ayunas para medir mi glucosa?", en: "Do I need to fast to have my glucose checked?" },
    options: [
      { id: "yes", label: { es: "Sí", en: "Yes" } },
      { id: "no", label: { es: "No", en: "No" } },
      { id: "depends", label: { es: "Depende", en: "It depends" } },
    ],
    correct: "depends",
    why: {
      es: "Para la glucosa en ayunas sí: 8 horas sin comer (el agua está permitida). Si vienes tras comer, también te la medimos y la interpretamos según la hora de tu última comida.",
      en: "For a fasting glucose, yes: 8 hours without food (water is fine). If you've eaten, we still measure it and interpret it based on when you last ate.",
    },
  },
  {
    id: "standing-rest", category: "shift", emoji: "🍽️",
    question: { es: "Llevo 6 horas de pie en hostelería: ¿cuál es la mejor postura de descanso?", en: "6 hours on my feet in hospitality: what's the best way to rest?" },
    options: [
      { id: "legs-up", label: { es: "Sentarme con las piernas en alto", en: "Sit with my legs raised" } },
      { id: "crossed", label: { es: "Sentarme con las piernas cruzadas", en: "Sit with my legs crossed" } },
      { id: "lean", label: { es: "Seguir de pie apoyado en la barra", en: "Keep standing, leaning on the bar" } },
    ],
    correct: "legs-up",
    why: {
      es: "Elevar las piernas unos 10 minutos ayuda a que la sangre vuelva al corazón y alivia la pesadez. Cruzarlas dificulta la circulación.",
      en: "Raising your legs for about 10 minutes helps blood return to the heart and eases heavy legs. Crossing them makes circulation harder.",
    },
  },
  {
    id: "silent-bp", category: "heart", emoji: "🤫",
    question: { es: "Si tuviera la tensión alta, lo notaría.", en: "If I had high blood pressure, I'd feel it." },
    options: MV, correct: "myth",
    why: {
      es: "La hipertensión casi nunca da síntomas: por eso la llaman \"el asesino silencioso\". La única forma de saberlo es medirla.",
      en: "High blood pressure rarely causes symptoms — that's why it's called the \"silent killer\". The only way to know is to measure it.",
    },
  },
  {
    id: "water-fasting", category: "metabolic", emoji: "💧",
    question: { es: "Si voy en ayunas a la analítica, ¿puedo beber agua?", en: "If I'm fasting for a blood test, can I drink water?" },
    options: [
      { id: "yes", label: { es: "Sí", en: "Yes" } },
      { id: "no", label: { es: "No", en: "No" } },
    ],
    correct: "yes",
    why: {
      es: "El agua no altera la glucosa ni el colesterol, y estar bien hidratado facilita el pinchazo. Lo que no vale es café, zumo ni chicle.",
      en: "Water doesn't affect glucose or cholesterol, and being hydrated makes the finger-prick easier. Coffee, juice and gum don't count as fasting.",
    },
  },
  {
    id: "night-shift", category: "shift", emoji: "🌙",
    question: { es: "Trabajar de noche durante años aumenta el riesgo de problemas metabólicos.", en: "Years of night shifts raise the risk of metabolic problems." },
    options: MV, correct: "fact",
    why: {
      es: "Alterar el ritmo de sueño se asocia a más riesgo de diabetes tipo 2 y sobrepeso. Revisar glucosa y peso con regularidad ayuda a detectarlo pronto.",
      en: "Disrupting your sleep rhythm is linked to higher risk of type 2 diabetes and weight gain. Regular glucose and weight checks help catch it early.",
    },
  },
  {
    id: "20-20-20", category: "eyes", emoji: "🖥️",
    question: { es: "Trabajo frente a pantalla: ¿cada cuánto descanso la vista?", en: "I work at a screen: how often should I rest my eyes?" },
    options: [
      { id: "20m", label: { es: "Cada 20 minutos", en: "Every 20 minutes" } },
      { id: "2h", label: { es: "Cada 2 horas", en: "Every 2 hours" } },
      { id: "end", label: { es: "Al acabar el turno", en: "At the end of my shift" } },
    ],
    correct: "20m",
    why: {
      es: "Regla 20-20-20: cada 20 minutos, mira algo a 6 metros durante 20 segundos. Relaja el enfoque y reduce la fatiga visual.",
      en: "The 20-20-20 rule: every 20 minutes, look at something 20 feet (6 m) away for 20 seconds. It relaxes focus and reduces eye strain.",
    },
  },
  {
    id: "lifting", category: "shift", emoji: "📦",
    question: { es: "Para levantar una caja pesada, ¿qué doblo?", en: "To lift a heavy box, what should I bend?" },
    options: [
      { id: "back", label: { es: "La espalda", en: "My back" } },
      { id: "knees", label: { es: "Las rodillas", en: "My knees" } },
    ],
    correct: "knees",
    why: {
      es: "Flexiona rodillas, espalda recta y la carga pegada al cuerpo. Así el esfuerzo lo hacen las piernas y no las lumbares.",
      en: "Bend your knees, keep your back straight and the load close to your body. Your legs do the work, not your lower back.",
    },
  },
  {
    id: "sunscreen", category: "skin", emoji: "☀️",
    question: { es: "Si trabajo al aire libre, solo necesito protector solar en verano.", en: "If I work outdoors, I only need sunscreen in summer." },
    options: MV, correct: "myth",
    why: {
      es: "En Madrid la radiación UV es relevante casi todo el año, sobre todo a mediodía. Gorra, manga y protector también en primavera y otoño.",
      en: "In Madrid UV levels matter most of the year, especially around midday. Use a cap, sleeves and sunscreen in spring and autumn too.",
    },
  },
  {
    id: "mole-change", category: "skin", emoji: "🔍",
    question: { es: "Un lunar que cambia de forma o color debe revisarlo un profesional.", en: "A mole that changes shape or colour should be checked by a professional." },
    options: MV, correct: "fact",
    why: {
      es: "Asimetría, Bordes irregulares, Color variado, Diámetro > 6 mm y Evolución: la regla ABCDE. Si notas cambios, ven a revisarlo.",
      en: "Asymmetry, irregular Borders, mixed Colour, Diameter > 6 mm and Evolution: the ABCDE rule. If you notice changes, come and get it checked.",
    },
  },
  {
    id: "energy-drink", category: "eyes", emoji: "🚚",
    question: { es: "En rutas largas, una bebida energética sustituye a una parada para descansar.", en: "On long routes, an energy drink replaces a rest stop." },
    options: MV, correct: "myth",
    why: {
      es: "La cafeína no elimina el cansancio acumulado y pueden aparecer microsueños. Para cada 2 horas y, si notas sueño, descansa de verdad.",
      en: "Caffeine doesn't erase built-up tiredness and microsleeps can still happen. Stop every 2 hours and, if you feel drowsy, actually rest.",
    },
  },
  {
    id: "dizzy", category: "heart", emoji: "😵‍💫",
    question: { es: "Si me mareo al levantarme rápido tras horas agachado, ¿qué hago?", en: "If I get dizzy standing up fast after hours crouching, what should I do?" },
    options: [
      { id: "slow", label: { es: "Incorporarme despacio y beber agua", en: "Get up slowly and drink water" } },
      { id: "ignore", label: { es: "Ignorarlo, es normal siempre", en: "Ignore it, it's always normal" } },
    ],
    correct: "slow",
    why: {
      es: "Levantarse en dos tiempos y mantenerse hidratado reduce los mareos. Si se repiten a menudo, mídete la tensión en una Parada.",
      en: "Standing up in two steps and staying hydrated reduces dizziness. If it happens often, get your blood pressure checked at a Parada.",
    },
  },
];

export const CATEGORY_LABEL: Record<QuizCategory, L> = {
  heart: { es: "Corazón", en: "Heart" },
  eyes: { es: "Vista y conducción", en: "Eyes & driving" },
  shift: { es: "Turnos y cuerpo", en: "Shifts & body" },
  metabolic: { es: "Analítica", en: "Blood tests" },
  skin: { es: "Piel y sol", en: "Skin & sun" },
};
