import { useStore } from "@/store";

export type Lang = "es" | "en";
/** Every user-facing string in PARADA is a bilingual pair. */
export type L = { es: string; en: string };

export function useLang() {
  const lang = useStore((s) => s.lang);
  const t = (l: L) => l[lang];
  return { lang, t };
}

export const WEEKDAYS: Record<number, { short: L; long: L }> = {
  1: { short: { es: "L", en: "Mon" }, long: { es: "lunes", en: "Monday" } },
  2: { short: { es: "M", en: "Tue" }, long: { es: "martes", en: "Tuesday" } },
  3: { short: { es: "X", en: "Wed" }, long: { es: "miércoles", en: "Wednesday" } },
  4: { short: { es: "J", en: "Thu" }, long: { es: "jueves", en: "Thursday" } },
  5: { short: { es: "V", en: "Fri" }, long: { es: "viernes", en: "Friday" } },
  6: { short: { es: "S", en: "Sat" }, long: { es: "sábado", en: "Saturday" } },
  7: { short: { es: "D", en: "Sun" }, long: { es: "domingo", en: "Sunday" } },
};
