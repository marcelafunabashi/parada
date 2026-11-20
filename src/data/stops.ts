import type { L } from "@/i18n";
import type { Slot, Weekday } from "@/lib/time";
import type { TestId } from "./tests";

export type LineId = "L1" | "L2" | "L3" | "L6" | "L8" | "L9" | "L10" | "C" | "BUS";

export const LINES: Record<LineId, { label: string; bg: string; fg: string; name: L }> = {
  L1: { label: "1", bg: "#38a3dc", fg: "#ffffff", name: { es: "Metro Línea 1", en: "Metro Line 1" } },
  L2: { label: "2", bg: "#e0292f", fg: "#ffffff", name: { es: "Metro Línea 2", en: "Metro Line 2" } },
  L3: { label: "3", bg: "#ffe114", fg: "#0f172a", name: { es: "Metro Línea 3", en: "Metro Line 3" } },
  L6: { label: "6", bg: "#9ca3af", fg: "#0f172a", name: { es: "Metro Línea 6 (circular)", en: "Metro Line 6 (circular)" } },
  L8: { label: "8", bg: "#f373b7", fg: "#0f172a", name: { es: "Metro Línea 8", en: "Metro Line 8" } },
  L9: { label: "9", bg: "#990d66", fg: "#ffffff", name: { es: "Metro Línea 9", en: "Metro Line 9" } },
  L10: { label: "10", bg: "#1b3b8f", fg: "#ffffff", name: { es: "Metro Línea 10", en: "Metro Line 10" } },
  C: { label: "C", bg: "#e2001a", fg: "#ffffff", name: { es: "Cercanías Renfe", en: "Cercanías commuter rail" } },
  BUS: { label: "EMT", bg: "#1e40af", fg: "#ffffff", name: { es: "Autobús EMT", en: "EMT city bus" } },
};

export interface Stop {
  id: string;
  name: string;
  district: string;
  address: L;
  spot: L; // exact parking spot description
  lat: number;
  lng: number;
  lines: LineId[];
  slots: Slot[];
  tests: TestId[];
  equipment: L[];
  audience: L;
  baseWait: number; // minutes
}

const days = (ds: Weekday[], open: string, close: string): Slot[] => ds.map((day) => ({ day, open, close }));

export const STOPS: Stop[] = [
  {
    id: "sol", name: "Puerta del Sol", district: "Centro",
    address: { es: "Plaza de la Puerta del Sol, esquina C/ Carretas", en: "Puerta del Sol square, corner of Calle Carretas" },
    spot: { es: "Junto a la salida de Cercanías, frente al Km 0", en: "Next to the Cercanías exit, facing Km 0" },
    lat: 40.4169, lng: -3.7035, lines: ["L1", "L2", "L3", "C"],
    slots: [...days([1, 3, 5], "07:00", "11:00"), ...days([1, 3, 5], "15:00", "19:30")],
    tests: ["bp", "glucose", "cholesterol", "bmi", "vision", "spo2", "mole"],
    equipment: [
      { es: "Tensiómetro automático validado", en: "Validated automatic BP monitor" },
      { es: "Glucómetro y analizador de lípidos capilar", en: "Glucometer & capillary lipid analyser" },
      { es: "Dermatoscopio digital", en: "Digital dermatoscope" },
    ],
    audience: { es: "Comercio y hostelería del centro", en: "Downtown retail & hospitality" },
    baseWait: 9,
  },
  {
    id: "nuevos-ministerios", name: "Nuevos Ministerios", district: "Chamberí / Tetuán",
    address: { es: "Paseo de la Castellana 67 (lateral)", en: "Paseo de la Castellana 67 (side lane)" },
    spot: { es: "Acera del intercambiador, acceso Raimundo Fdez. Villaverde", en: "Interchange sidewalk, Raimundo Fdez. Villaverde entrance" },
    lat: 40.4462, lng: -3.6917, lines: ["L6", "L8", "L10", "C"],
    slots: days([1, 2, 3, 4, 5], "08:00", "14:00"),
    tests: ["bp", "glucose", "cholesterol", "bmi", "vision", "ecg", "spo2"],
    equipment: [
      { es: "Electrocardiógrafo de 12 derivaciones", en: "12-lead ECG" },
      { es: "Optotipo digital", en: "Digital eye chart" },
      { es: "Báscula y tallímetro", en: "Scale & stadiometer" },
    ],
    audience: { es: "Limpieza y mantenimiento de oficinas", en: "Office cleaning & maintenance" },
    baseWait: 7,
  },
  {
    id: "mendez-alvaro", name: "Méndez Álvaro", district: "Arganzuela",
    address: { es: "Estación Sur de Autobuses, C/ Méndez Álvaro 83", en: "Estación Sur bus station, Calle Méndez Álvaro 83" },
    spot: { es: "Dársena exterior, junto a la parada de taxis", en: "Outer bay, next to the taxi rank" },
    lat: 40.3953, lng: -3.6789, lines: ["L6", "C"],
    slots: [...days([2, 4], "06:00", "12:00"), ...days([2, 4], "16:00", "21:00")],
    tests: ["bp", "glucose", "vision", "hearing", "ecg", "bmi", "spo2"],
    equipment: [
      { es: "Cabina de audiometría portátil", en: "Portable audiometry booth" },
      { es: "Electrocardiógrafo", en: "ECG machine" },
      { es: "Optotipo digital", en: "Digital eye chart" },
    ],
    audience: { es: "Conductores de autobús y logística", en: "Bus drivers & logistics" },
    baseWait: 6,
  },
  {
    id: "atocha", name: "Atocha", district: "Retiro / Arganzuela",
    address: { es: "Glorieta del Emperador Carlos V", en: "Glorieta del Emperador Carlos V" },
    spot: { es: "Lateral del Museo Reina Sofía, salida Cercanías", en: "Beside Reina Sofía museum, Cercanías exit" },
    lat: 40.4065, lng: -3.6905, lines: ["L1", "C"],
    slots: [...days([1, 2, 3, 4, 5], "06:30", "10:30"), ...days([2, 4], "17:00", "20:30")],
    tests: ["bp", "glucose", "cholesterol", "bmi", "spo2", "mole"],
    equipment: [
      { es: "Tensiómetro automático validado", en: "Validated automatic BP monitor" },
      { es: "Analizador capilar de glucosa y colesterol", en: "Capillary glucose & cholesterol analyser" },
      { es: "Dermatoscopio digital", en: "Digital dermatoscope" },
    ],
    audience: { es: "Personal de estación, limpieza y hostelería", en: "Station staff, cleaning & hospitality" },
    baseWait: 11,
  },
  {
    id: "chamartin", name: "Chamartín", district: "Chamartín",
    address: { es: "C/ Agustín de Foxá s/n (estación)", en: "Calle Agustín de Foxá s/n (station)" },
    spot: { es: "Aparcamiento de la entrada principal", en: "Main entrance parking area" },
    lat: 40.4722, lng: -3.6829, lines: ["L1", "L10", "C"],
    slots: [...days([1, 2], "14:00", "20:00"), ...days([4, 5], "07:00", "13:00")],
    tests: ["bp", "glucose", "cholesterol", "bmi", "vision", "ecg", "spo2", "hearing"],
    equipment: [
      { es: "Electrocardiógrafo de 12 derivaciones", en: "12-lead ECG" },
      { es: "Cabina de audiometría portátil", en: "Portable audiometry booth" },
      { es: "Analizador capilar de lípidos", en: "Capillary lipid analyser" },
    ],
    audience: { es: "Obras de Madrid Nuevo Norte", en: "Madrid Nuevo Norte construction sites" },
    baseWait: 8,
  },
  {
    id: "plaza-castilla", name: "Plaza de Castilla", district: "Tetuán",
    address: { es: "Intercambiador de Plaza de Castilla, Pº Castellana 189", en: "Plaza de Castilla interchange, Pº Castellana 189" },
    spot: { es: "Junto a las Torres KIO, lado Bravo Murillo", en: "Next to the KIO Towers, Bravo Murillo side" },
    lat: 40.4669, lng: -3.6889, lines: ["L1", "L9", "L10"],
    slots: [...days([3], "07:00", "15:00"), ...days([1, 5], "13:00", "19:00")],
    tests: ["bp", "glucose", "bmi", "vision", "spo2", "mole"],
    equipment: [
      { es: "Optotipo digital", en: "Digital eye chart" },
      { es: "Dermatoscopio digital", en: "Digital dermatoscope" },
      { es: "Tensiómetro automático validado", en: "Validated automatic BP monitor" },
    ],
    audience: { es: "Seguridad, conserjería y repartidores", en: "Security, concierge & delivery riders" },
    baseWait: 5,
  },
  {
    id: "villaverde-alto", name: "Villaverde Alto", district: "Villaverde",
    address: { es: "Av. de Andalucía con C/ Domingo Párraga", en: "Av. de Andalucía at Calle Domingo Párraga" },
    spot: { es: "Junto al intercambiador de metro y Cercanías", en: "Next to the metro & Cercanías interchange" },
    lat: 40.3413, lng: -3.7116, lines: ["L3", "C"],
    slots: [...days([1, 2, 3, 4, 5], "05:30", "09:30"), ...days([3], "14:00", "18:00")],
    tests: ["bp", "glucose", "cholesterol", "bmi", "ecg", "hearing", "spo2"],
    equipment: [
      { es: "Electrocardiógrafo", en: "ECG machine" },
      { es: "Cabina de audiometría portátil", en: "Portable audiometry booth" },
      { es: "Analizador capilar de lípidos", en: "Capillary lipid analyser" },
    ],
    audience: { es: "Polígonos industriales y almacenes", en: "Industrial parks & warehouses" },
    baseWait: 10,
  },
  {
    id: "legazpi", name: "Legazpi", district: "Arganzuela",
    address: { es: "Plaza de Legazpi, frente a Matadero Madrid", en: "Plaza de Legazpi, opposite Matadero Madrid" },
    spot: { es: "Bulevar central, salida Paseo de la Chopera", en: "Central boulevard, Paseo de la Chopera exit" },
    lat: 40.3911, lng: -3.6953, lines: ["L3", "L6"],
    slots: [...days([2, 4], "08:00", "14:00"), ...days([5], "15:00", "20:00")],
    tests: ["bp", "glucose", "bmi", "vision", "mole", "spo2"],
    equipment: [
      { es: "Dermatoscopio digital", en: "Digital dermatoscope" },
      { es: "Optotipo digital", en: "Digital eye chart" },
      { es: "Glucómetro capilar", en: "Capillary glucometer" },
    ],
    audience: { es: "Mantenimiento urbano y jardinería", en: "City maintenance & gardening" },
    baseWait: 4,
  },
  {
    id: "mercamadrid", name: "Mercamadrid", district: "Villa de Vallecas",
    address: { es: "Av. de Madrid s/n, acceso Nave de Frutas", en: "Av. de Madrid s/n, Fruit Market building gate" },
    spot: { es: "Aparcamiento central junto al Centro de Servicios", en: "Central car park by the Services Centre" },
    lat: 40.3622, lng: -3.6461, lines: ["BUS"],
    slots: days([1, 2, 3, 4, 5], "04:00", "09:00"),
    tests: ["bp", "glucose", "cholesterol", "bmi", "ecg", "spo2", "mole"],
    equipment: [
      { es: "Electrocardiógrafo de 12 derivaciones", en: "12-lead ECG" },
      { es: "Analizador capilar de glucosa y colesterol", en: "Capillary glucose & cholesterol analyser" },
      { es: "Báscula, tallímetro y cinta métrica", en: "Scale, stadiometer & tape" },
    ],
    audience: { es: "Mercado mayorista y transporte de madrugada", en: "Wholesale market & early-morning transport" },
    baseWait: 12,
  },
];

export const stopById = (id: string) => STOPS.find((s) => s.id === id);

/** Deterministic "live" wait estimate that drifts every 10 minutes. */
export function waitRange(stop: Stop, now = Date.now()): [number, number] {
  const bucket = Math.floor(now / 600000);
  const seed = (bucket * 9301 + stop.id.length * 49297 + stop.baseWait * 233) % 233280;
  const jitter = Math.round((seed / 233280) * 6) - 3;
  const lo = Math.max(0, stop.baseWait + jitter - 3);
  return [lo, lo + 5];
}
