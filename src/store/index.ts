import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { L, Lang } from "@/i18n";
import type { TestId } from "@/data/tests";
import { STOPS } from "@/data/stops";
import { QUIZ } from "@/data/quiz";
import { XP, tierFor, type BadgeId } from "@/data/game";
import { makePassCode } from "@/lib/utils";
import { MADRID_TZ, madridNow, openState, openSortKey } from "@/lib/time";

/* ---------------- types ---------------- */
export type PassStatus = "ready" | "queued" | "in-exam" | "done";
export interface Pass {
  code: string;
  stopId: string;
  tests: TestId[];
  createdAt: number;
  status: PassStatus;
  priority: boolean;
  pack?: L;
}

export type QueueStatus = "waiting" | "in-exam" | "done";
export interface QueueEntry {
  id: string;
  name: string;
  code: string;
  stopId: string;
  tests: TestId[];
  checkedInAt: number;
  status: QueueStatus;
  priority: boolean;
  isMe?: boolean;
  job: L;
}

export interface ResultValues {
  systolic?: number;
  diastolic?: number;
  glucose?: number;
  cholesterol?: number;
  bmi?: number;
  waist?: number;
  vision?: number;
  spo2?: number;
  ecg?: "normal" | "review";
  mole?: "normal" | "watch" | "refer";
  hearing?: "normal" | "review";
}
export interface ResultSet {
  id: string;
  date: number;
  stopId: string;
  doctor: string;
  values: ResultValues;
  summary: L;
  nextSteps: L[];
}

export interface Visit { id: string; date: number; stopId: string; tests: TestId[]; minutes: number; resultId?: string }
export interface FollowUp { id: string; title: L; due: L; done: boolean }
export type DocKind = "analysis" | "prescription" | "report" | "vaccine";
export interface HealthDoc {
  id: string;
  name: string;
  kind: DocKind;
  uploadedAt: number;
  status: "pending" | "verified" | "rejected";
  note?: L;
  reviewer?: string;
}
export interface Message { id: string; from: "me" | "team"; author: string; text: string | L; at: number }

export interface GameState {
  xp: number;
  streak: number;
  lastPlayed: string | null; // YYYY-MM-DD Madrid
  answered: Record<string, boolean>;
  badges: BadgeId[];
  readinessDone: boolean;
}

export const ME = {
  name: "Lucía Fernández",
  sex: "F" as const,
  job: { es: "Camarera · Hostelería", en: "Waitress · Hospitality" },
};

interface State {
  lang: Lang;
  sound: boolean;
  clinicMinutes: number; // what a standard clinic visit costs the worker (travel + wait + return)
  pass: Pass | null;
  queue: QueueEntry[];
  results: ResultSet[]; // newest first
  visits: Visit[];
  followUps: FollowUp[];
  documents: HealthDoc[];
  messages: Message[];
  game: GameState;

  setLang: (l: Lang) => void;
  toggleSound: () => void;
  setClinicMinutes: (m: number) => void;
  createPass: (p: { stopId: string; tests: TestId[]; pack?: L }) => Pass;
  setPassTests: (tests: TestId[], pack?: L) => void;
  cancelPass: () => void;
  checkIn: () => void;
  applyPriority: () => void;
  setEntryStatus: (id: string, status: QueueStatus) => void;
  publishResults: (entryId: string, payload: { values: ResultValues; summary: L; nextSteps: L[]; doctor: string }) => void;
  uploadDocument: (d: { name: string; kind: DocKind }) => string;
  reviewDocument: (id: string, status: "verified" | "rejected", reviewer: string, note?: L) => void;
  sendMessage: (text: string) => void;
  teamReply: (text: string | L, author: string) => void;
  toggleFollowUp: (id: string) => void;
  answerQuiz: (cardId: string, correct: boolean) => { xpGained: number; newBadges: BadgeId[] };
  completeReadiness: () => void;
  resetDemo: () => void;
}

/* ---------------- helpers ---------------- */
export const madridDateKey = (d: Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: MADRID_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const uid = () => Math.random().toString(36).slice(2, 10);
const DAY = 86400000;
const MIN = 60000;

export function defaultStopId(): string {
  const now = madridNow();
  return [...STOPS].sort((a, b) => openSortKey(openState(a.slots, now)) - openSortKey(openState(b.slots, now)))[0].id;
}

/** Keep the preferred stop if it offers every test; otherwise the soonest-open stop with the best coverage. */
export function bestStopFor(tests: TestId[], preferred?: string): string {
  const covers = (id: string) => tests.filter((x) => STOPS.find((s) => s.id === id)!.tests.includes(x)).length;
  if (preferred && covers(preferred) === tests.length) return preferred;
  const now = madridNow();
  return [...STOPS].sort((a, b) => covers(b.id) - covers(a.id) || openSortKey(openState(a.slots, now)) - openSortKey(openState(b.slots, now)))[0].id;
}

function computeBadges(s: Pick<State, "game" | "pass" | "visits">): BadgeId[] {
  const out = new Set<BadgeId>(s.game.badges);
  const right = (cat: string) => QUIZ.filter((q) => q.category === cat && s.game.answered[q.id] === true).length;
  const total = (cat: string) => QUIZ.filter((q) => q.category === cat).length;
  if (right("heart") === total("heart")) out.add("corazon");
  if (right("eyes") + right("skin") >= 3) out.add("lince");
  if (right("shift") === total("shift")) out.add("turno");
  if (s.game.streak >= 3) out.add("semana");
  if (s.pass && s.pass.status !== "ready") out.add("primera");
  return [...out];
}

const OTHER_NAMES = [
  ["Carlos Moreno", { es: "Repartidor", en: "Delivery rider" }],
  ["Aitana Ruiz", { es: "Dependienta", en: "Shop assistant" }],
  ["Mohamed El Idrissi", { es: "Albañil", en: "Bricklayer" }],
  ["Rosa Jiménez", { es: "Limpieza", en: "Cleaner" }],
  ["Andrés Castillo", { es: "Conductor EMT", en: "Bus driver" }],
  ["Daniela Rojas", { es: "Cocinera", en: "Cook" }],
  ["Iván Popescu", { es: "Mozo de almacén", en: "Warehouse worker" }],
  ["Marta Sanz", { es: "Cajera", en: "Cashier" }],
  ["Javier Ortega", { es: "Vigilante", en: "Security guard" }],
  ["Yolanda Pérez", { es: "Camarera de pisos", en: "Housekeeper" }],
  ["Kevin Mendoza", { es: "Mantenimiento", en: "Maintenance" }],
  ["Fátima Benali", { es: "Frutería mayorista", en: "Wholesale produce" }],
] as const;

function seedQueue(): QueueEntry[] {
  const now = Date.now();
  const out: QueueEntry[] = [];
  STOPS.forEach((stop, si) => {
    const n = 2 + (si % 3);
    for (let i = 0; i < n; i++) {
      const [name, job] = OTHER_NAMES[(si * 3 + i) % OTHER_NAMES.length];
      const tests = stop.tests.filter((_, ti) => (ti + i + si) % 3 !== 0).slice(0, 3 + (i % 2));
      out.push({
        id: uid(),
        name,
        job: { ...job },
        code: makePassCode(),
        stopId: stop.id,
        tests,
        checkedInAt: now - (n - i) * 6 * MIN,
        status: i === 0 ? "in-exam" : "waiting",
        priority: false,
      });
    }
  });
  return out;
}

function seed() {
  const now = Date.now();
  const year = Number(madridDateKey().slice(0, 4));
  const d = (m: number, day: number) => Date.UTC(year, m - 1, day, 8, 30);
  const yesterday = madridDateKey(new Date(now - DAY));

  const latest: ResultSet = {
    id: "r-jun",
    date: d(6, 12),
    stopId: "sol",
    doctor: "Dra. Carmen Ruiz",
    values: {
      systolic: 132, diastolic: 84, glucose: 94, cholesterol: 214, bmi: 26.1, waist: 82,
      vision: 0.8, spo2: 98, ecg: "normal", mole: "watch",
    },
    summary: {
      es: "Lucía, en general estás bien. Tu tensión está un poco por encima de lo ideal (132/84): no es hipertensión, pero conviene vigilarla. El colesterol está ligeramente alto (214) y tienes un lunar en el hombro izquierdo que quiero volver a ver en 3 meses. Tu corazón (ECG) y tu glucosa están perfectos.",
      en: "Lucía, overall you're doing well. Your blood pressure is slightly above ideal (132/84): it's not hypertension, but worth watching. Your cholesterol is a little high (214) and there's a mole on your left shoulder I'd like to see again in 3 months. Your heart (ECG) and glucose are perfect.",
    },
    nextSteps: [
      { es: "Vuelve a medirte la tensión en 3 meses en cualquier Parada (3 min).", en: "Recheck your blood pressure in 3 months at any Parada (3 min)." },
      { es: "Reduce embutidos y bollería; camina 30 min al día, aunque sea en tramos.", en: "Cut back on cured meats and pastries; walk 30 min a day, even in short bursts." },
      { es: "Foto del lunar del hombro cada mes: si cambia, sube la foto a la app.", en: "Photo of the shoulder mole every month: if it changes, upload it to the app." },
      { es: "Gafas: tu vista de lejos ha bajado un poco. Consulta con tu óptica.", en: "Glasses: your distance vision has dropped slightly. Check with your optician." },
    ],
  };

  return {
    clinicMinutes: 130,
    pass: null as Pass | null,
    queue: seedQueue(),
    results: [latest],
    visits: [
      { id: "v1", date: d(6, 12), stopId: "sol", tests: ["bp", "glucose", "cholesterol", "bmi", "vision", "spo2", "mole"] as TestId[], minutes: 19, resultId: "r-jun" },
      { id: "v2", date: d(3, 4), stopId: "atocha", tests: ["bp", "glucose", "bmi"] as TestId[], minutes: 14 },
      { id: "v3", date: Date.UTC(year - 1, 9, 21, 7), stopId: "atocha", tests: ["bp", "spo2"] as TestId[], minutes: 9 },
    ],
    followUps: [
      { id: "f1", title: { es: "Repetir tensión arterial", en: "Recheck blood pressure" }, due: { es: "Septiembre · cualquier Parada", en: "September · any Parada" }, done: false },
      { id: "f2", title: { es: "Revisar lunar del hombro izquierdo", en: "Recheck left-shoulder mole" }, due: { es: "Septiembre · parada con dermatoscopio", en: "September · stop with dermatoscope" }, done: false },
      { id: "f3", title: { es: "Revisión en óptica", en: "Optician check" }, due: { es: "Cuando puedas", en: "When you can" }, done: false },
    ],
    documents: [
      { id: "d0", name: "analitica_centro_salud_2025.pdf", kind: "analysis" as DocKind, uploadedAt: d(3, 4), status: "verified" as const, reviewer: "Dra. Carmen Ruiz", note: { es: "Revisada y añadida a tu historial.", en: "Reviewed and added to your history." } },
    ],
    messages: [
      {
        id: "m0", from: "team" as const, author: "Dra. Carmen Ruiz", at: d(6, 12) + 3 * 3600000,
        text: {
          es: "¡Hola Lucía! Ya tienes tus resultados. Si algo no se entiende, pregúntame aquí: te contestamos en el día.",
          en: "Hi Lucía! Your results are ready. If anything is unclear, ask me here — we reply the same day.",
        },
      },
    ],
    game: { xp: 22, streak: 2, lastPlayed: yesterday, answered: {}, badges: [], readinessDone: false } as GameState,
  };
}

/* ---------------- store ---------------- */
export const useStore = create<State>()(
  persist(
    (set, get) => ({
      lang: "es",
      sound: true,
      ...seed(),

      setLang: (lang) => {
        document.documentElement.lang = lang;
        set({ lang });
      },
      toggleSound: () => set((s) => ({ sound: !s.sound })),
      setClinicMinutes: (clinicMinutes) => set({ clinicMinutes }),

      createPass: ({ stopId, tests, pack }) => {
        const old = get().pass;
        const pass: Pass = { code: makePassCode(), stopId, tests, pack, createdAt: Date.now(), status: "ready", priority: false };
        set((s) => ({
          pass,
          // a new pass replaces any queued old one
          queue: old ? s.queue.filter((q) => !(q.isMe && q.status !== "done")) : s.queue,
        }));
        return pass;
      },
      setPassTests: (tests, pack) => {
        const s = get();
        if (!s.pass || s.pass.status === "done") {
          s.createPass({ stopId: bestStopFor(tests, s.pass?.stopId ?? defaultStopId()), tests, pack });
          return;
        }
        if (s.pass.status === "ready") {
          const stopId = bestStopFor(tests, s.pass.stopId);
          set({ pass: { ...s.pass, tests, pack, stopId } });
          return;
        }
        set({
          pass: { ...s.pass, tests, pack },
          queue: s.queue.map((q) => (q.isMe && q.status !== "done" ? { ...q, tests } : q)),
        });
      },
      cancelPass: () => set((s) => ({ pass: null, queue: s.queue.filter((q) => !(q.isMe && q.status !== "done")) })),

      checkIn: () => {
        const s = get();
        if (!s.pass || s.pass.status !== "ready") return;
        const entry: QueueEntry = {
          id: uid(), name: ME.name, job: ME.job, code: s.pass.code, stopId: s.pass.stopId, tests: s.pass.tests,
          checkedInAt: Date.now(), status: "waiting", priority: s.pass.priority, isMe: true,
        };
        const pass = { ...s.pass, status: "queued" as const };
        const game = { ...s.game, xp: s.game.xp + XP.checkIn };
        set({ pass, queue: [...s.queue, entry], game: { ...game, badges: computeBadges({ game, pass, visits: s.visits }) } });
      },

      applyPriority: () => {
        const s = get();
        if (!s.pass || (tierFor(s.game.xp).current?.min ?? 0) < 100) return;
        set({
          pass: { ...s.pass, priority: true },
          queue: s.queue.map((q) => (q.isMe && q.status !== "done" ? { ...q, priority: true } : q)),
        });
      },

      setEntryStatus: (id, status) => {
        const s = get();
        const entry = s.queue.find((q) => q.id === id);
        set({
          queue: s.queue.map((q) => (q.id === id ? { ...q, status } : q)),
          pass:
            entry?.isMe && s.pass && s.pass.code === entry.code
              ? { ...s.pass, status: status === "waiting" ? "queued" : status === "in-exam" ? "in-exam" : s.pass.status }
              : s.pass,
        });
      },

      publishResults: (entryId, payload) => {
        const s = get();
        const entry = s.queue.find((q) => q.id === entryId);
        if (!entry) return;
        const queue = s.queue.map((q) => (q.id === entryId ? { ...q, status: "done" as const } : q));
        if (!entry.isMe) return set({ queue });
        const result: ResultSet = { id: uid(), date: Date.now(), stopId: entry.stopId, ...payload };
        const minutes = Math.max(8, Math.round((Date.now() - entry.checkedInAt) / MIN));
        set({
          queue,
          results: [result, ...s.results],
          visits: [{ id: uid(), date: Date.now(), stopId: entry.stopId, tests: entry.tests, minutes: Math.min(minutes, 25), resultId: result.id }, ...s.visits],
          pass: s.pass ? { ...s.pass, status: "done" } : s.pass,
          messages: [
            ...s.messages,
            {
              id: uid(), from: "team", author: payload.doctor, at: Date.now(),
              text: {
                es: "Tus nuevos resultados ya están disponibles en la pestaña Resultados, con mi explicación. ¡Gracias por pasarte!",
                en: "Your new results are now in the Results tab, with my explanation. Thanks for stopping by!",
              },
            },
          ],
        });
      },

      uploadDocument: ({ name, kind }) => {
        const id = uid();
        set((s) => ({ documents: [{ id, name, kind, uploadedAt: Date.now(), status: "pending" }, ...s.documents] }));
        return id;
      },
      reviewDocument: (id, status, reviewer, note) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, status, reviewer, note } : d)) })),

      sendMessage: (text) =>
        set((s) => ({ messages: [...s.messages, { id: uid(), from: "me", author: ME.name, text, at: Date.now() }] })),
      teamReply: (text, author) =>
        set((s) => ({ messages: [...s.messages, { id: uid(), from: "team", author, text, at: Date.now() }] })),

      toggleFollowUp: (id) => set((s) => ({ followUps: s.followUps.map((f) => (f.id === id ? { ...f, done: !f.done } : f)) })),

      answerQuiz: (cardId, correct) => {
        const s = get();
        const today = madridDateKey();
        const yesterday = madridDateKey(new Date(Date.now() - DAY));
        let { streak, xp } = s.game;
        let gained = correct ? XP.correct : XP.wrong;
        if (s.game.lastPlayed !== today) {
          streak = s.game.lastPlayed === yesterday ? streak + 1 : 1;
          gained += XP.dailyBonus;
        }
        // Only the first correct answer for a card earns full XP.
        if (correct && s.game.answered[cardId] === true) gained = Math.min(gained, XP.wrong);
        xp += gained;
        const game: GameState = {
          ...s.game, xp, streak, lastPlayed: today,
          answered: { ...s.game.answered, [cardId]: s.game.answered[cardId] === true || correct },
        };
        const badges = computeBadges({ game, pass: s.pass, visits: s.visits });
        const newBadges = badges.filter((b) => !s.game.badges.includes(b));
        set({ game: { ...game, badges } });
        return { xpGained: gained, newBadges };
      },
      completeReadiness: () =>
        set((s) =>
          s.game.readinessDone ? {} : { game: { ...s.game, readinessDone: true, xp: s.game.xp + XP.readiness } },
        ),

      resetDemo: () => set({ ...seed() }),
    }),
    {
      name: "parada-store-v1",
      partialize: (s) => {
        // functions aren't serialisable; everything else is.
        const { lang, sound, clinicMinutes, pass, queue, results, visits, followUps, documents, messages, game } = s;
        return { lang, sound, clinicMinutes, pass, queue, results, visits, followUps, documents, messages, game };
      },
    },
  ),
);

// Real-time sync between tabs (e.g. worker phone view + clinician workspace side by side).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "parada-store-v1") useStore.persist.rehydrate();
  });
}
