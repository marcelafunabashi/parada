import { useEffect, useMemo, useState } from "react";
import {
  Search, Zap, UserRound, Clock, PhoneCall, Undo2, ShieldCheck, X, FileText, MessageCircle, Send, Wand2, CircleCheck, Users, Timer, ListChecks, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveDot, SectionTitle, useTick } from "@/components/brand";
import { useLang, type L } from "@/i18n";
import { useStore, defaultStopId, ME, type QueueEntry, type ResultValues } from "@/store";
import { STOPS, stopById } from "@/data/stops";
import { TESTS } from "@/data/tests";
import { RANGES, classify, waistRange, worst, LEVEL_LABEL, type Level } from "@/data/ranges";
import { madridDate, madridClock, madridNow, openState } from "@/lib/time";
import { cn } from "@/lib/utils";
import { burst, sfx } from "@/lib/fx";

const CLINICIAN = "Dra. Carmen Ruiz";

/* ---------- plain-language summary generator (bilingual) ---------- */
function generateSummary(first: string, v: ResultValues, sex: "F" | "M"): { summary: L; nextSteps: L[] } {
  const watch: L[] = [], high: L[] = [], ok: L[] = [], steps: L[] = [];
  const add = (lv: Level, name: L, step?: L) => {
    (lv === "normal" ? ok : lv === "warning" ? watch : high).push(name);
    if (lv !== "normal" && step) steps.push(step);
  };
  if (v.systolic && v.diastolic)
    add(worst([classify(RANGES.systolic, v.systolic), classify(RANGES.diastolic, v.diastolic)]), { es: `la tensión (${v.systolic}/${v.diastolic})`, en: `blood pressure (${v.systolic}/${v.diastolic})` },
      { es: "Vuelve a medirte la tensión en 3 meses en cualquier Parada.", en: "Recheck your blood pressure in 3 months at any Parada." });
  if (v.glucose)
    add(classify(RANGES.glucose, v.glucose), { es: `la glucosa (${v.glucose})`, en: `glucose (${v.glucose})` },
      { es: "Pide una analítica completa en tu centro de salud.", en: "Ask your health centre for a full blood test." });
  if (v.cholesterol)
    add(classify(RANGES.cholesterol, v.cholesterol), { es: `el colesterol (${v.cholesterol})`, en: `cholesterol (${v.cholesterol})` },
      { es: "Menos embutido y bollería; repetimos colesterol en 6 meses.", en: "Fewer cured meats and pastries; we'll recheck cholesterol in 6 months." });
  if (v.bmi)
    add(worst([classify(RANGES.bmi, v.bmi), ...(v.waist ? [classify(waistRange(sex), v.waist)] : [])]), { es: "el peso y la cintura", en: "weight and waist" },
      { es: "Camina 30 min al día, aunque sea en tramos de 10.", en: "Walk 30 min a day, even in 10-minute bursts." });
  if (v.vision)
    add(classify(RANGES.vision, v.vision), { es: "la vista", en: "your eyesight" },
      { es: "Revisión en una óptica para valorar gafas.", en: "See an optician to check whether you need glasses." });
  if (v.spo2) add(classify(RANGES.spo2, v.spo2), { es: "la oxigenación", en: "oxygen levels" });
  if (v.ecg) add(v.ecg === "normal" ? "normal" : "warning", { es: "el corazón (ECG)", en: "your heart (ECG)" },
    { es: "Te derivamos a cardiología con el trazado del ECG.", en: "We're referring you to cardiology with your ECG trace." });
  if (v.mole) add(v.mole === "normal" ? "normal" : v.mole === "watch" ? "warning" : "elevated", { es: "los lunares", en: "your moles" },
    { es: "Foto mensual del lunar señalado; súbela a la app si cambia.", en: "Monthly photo of the marked mole; upload it if it changes." });
  if (v.hearing) add(v.hearing === "normal" ? "normal" : "warning", { es: "la audición", en: "your hearing" },
    { es: "Usa protección auditiva en ambientes ruidosos.", en: "Wear hearing protection in noisy settings." });

  const join = (arr: L[], lang: "es" | "en") => {
    const xs = arr.map((x) => x[lang]);
    const and = lang === "es" ? " y " : " and ";
    return xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + and + xs.at(-1);
  };
  const mk = (lang: "es" | "en") => {
    const parts: string[] = [];
    if (!watch.length && !high.length) {
      parts.push(lang === "es" ? `${first}, ¡todo en orden! ${cap(join(ok, lang))} están dentro de lo normal.` : `${first}, everything looks good! ${cap(join(ok, lang))} are within normal range.`);
    } else {
      parts.push(lang === "es" ? `${first}, gracias por pasarte.` : `${first}, thanks for stopping by.`);
      if (high.length) parts.push(lang === "es" ? `Hay que prestar atención a ${join(high, lang)}: te explicamos abajo qué hacer.` : `We need to pay attention to ${join(high, lang)}: see below for what to do.`);
      if (watch.length) parts.push(lang === "es" ? `Conviene vigilar ${join(watch, lang)}, sin alarmas.` : `It's worth keeping an eye on ${join(watch, lang)}, nothing alarming.`);
      if (ok.length) parts.push(lang === "es" ? `${cap(join(ok, lang))}, perfecto.` : `${cap(join(ok, lang))}: all good.`);
    }
    return parts.join(" ");
  };
  return { summary: { es: mk("es"), en: mk("en") }, nextSteps: steps };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- vitals form ---------- */
type FormState = Record<string, string>;
const SAMPLE: FormState = { systolic: "126", diastolic: "79", glucose: "91", cholesterol: "198", weight: "66", height: "162", waist: "79", vision: "0.9", spo2: "98", ecg: "normal", mole: "watch", hearing: "normal" };

function Field({ id, label, unit, value, onChange, step = "1" }: { id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; step?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-violet-500">
        <input id={id} type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} className="min-h-12 w-full rounded-2xl bg-transparent px-3 text-lg font-bold outline-none" />
        {unit && <span className="pr-3 text-sm font-semibold text-slate-400">{unit}</span>}
      </span>
    </label>
  );
}

function Choice<T extends string>({ label, value, onChange, options }: { label: string; value: string; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
            className={cn("min-h-11 rounded-xl border-2 px-3 text-sm font-semibold", value === o.id ? "border-violet-600 bg-violet-50 text-violet-900" : "border-slate-200")}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function PatientPanel({ entry }: { entry: QueueEntry }) {
  const { t, lang } = useLang();
  const setStatus = useStore((s) => s.setEntryStatus);
  const publish = useStore((s) => s.publishResults);
  const [f, setF] = useState<FormState>({});
  const [summary, setSummary] = useState<L>({ es: "", en: "" });
  const [steps, setSteps] = useState<L[]>([]);
  const has = (id: string) => entry.tests.includes(id as never);
  const set = (k: string) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  useEffect(() => { setF({}); setSummary({ es: "", en: "" }); setSteps([]); }, [entry.id]);

  const values = useMemo<ResultValues>(() => {
    const n = (k: string) => (f[k] ? Number(f[k]) : undefined);
    const w = n("weight"), h = n("height");
    const v: ResultValues = {};
    if (has("bp")) { v.systolic = n("systolic"); v.diastolic = n("diastolic"); }
    if (has("glucose")) v.glucose = n("glucose");
    if (has("cholesterol")) v.cholesterol = n("cholesterol");
    if (has("bmi")) { v.bmi = w && h ? Math.round((w / (h / 100) ** 2) * 10) / 10 : undefined; v.waist = n("waist"); }
    if (has("vision")) v.vision = n("vision");
    if (has("spo2")) v.spo2 = n("spo2");
    if (has("ecg") && f.ecg) v.ecg = f.ecg as ResultValues["ecg"];
    if (has("mole") && f.mole) v.mole = f.mole as ResultValues["mole"];
    if (has("hearing") && f.hearing) v.hearing = f.hearing as ResultValues["hearing"];
    return v;
  }, [f, entry.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const filled = Object.values(values).filter((x) => x !== undefined).length;
  const first = entry.name.split(" ")[0];
  const sex = entry.isMe ? ME.sex : "M";
  const gen = () => { const g = generateSummary(first, values, sex); setSummary(g.summary); setSteps(g.nextSteps); sfx("tap"); };

  const doPublish = () => {
    const g = summary.es ? { summary, nextSteps: steps } : generateSummary(first, values, sex);
    publish(entry.id, { values, summary: g.summary, nextSteps: g.nextSteps, doctor: CLINICIAN });
    sfx("level");
    burst();
  };

  const flag = (lv: Level) => <Badge variant={lv === "normal" ? "normal" : lv === "warning" ? "warning" : "elevated"}>{t(LEVEL_LABEL[lv])}</Badge>;

  return (
    <div className="animate-slide-up">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><UserRound className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black">{entry.name} {entry.isMe && <Badge variant="brand" className="ml-1 align-middle">{t({ es: "Demo · app del trabajador", en: "Demo · worker app" })}</Badge>}</h2>
          <p className="text-sm text-slate-600">{t(entry.job)} · <span className="font-mono font-bold tracking-widest">{entry.code}</span></p>
        </div>
        {entry.priority && <Badge variant="brand"><Zap />{t({ es: "Prioritario", en: "Priority" })}</Badge>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{entry.tests.map((id) => <Badge key={id} variant="violet">{t(TESTS[id].short)}</Badge>)}</div>

      {entry.status === "done" ? (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-900"><CircleCheck className="size-5" />{t({ es: "Resultados publicados y sincronizados con la app del trabajador.", en: "Results published and synced to the worker's app." })}</p>
      ) : entry.status === "waiting" ? (
        <Button className="mt-5 w-full" size="lg" onClick={() => { setStatus(entry.id, "in-exam"); sfx("tap"); }}><PhoneCall />{t({ es: "Llamar a consulta", en: "Call into exam room" })}</Button>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold">{t({ es: "Entrada rápida de resultados", en: "Rapid result entry" })}</h3>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setF(SAMPLE)}><ListChecks />{t({ es: "Valores de ejemplo", en: "Sample values" })}</Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus(entry.id, "waiting")}><Undo2 />{t({ es: "A la cola", en: "Back to queue" })}</Button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {has("bp") && (<>
              <Field id="sys" label={t({ es: "Sistólica", en: "Systolic" })} unit="mmHg" value={f.systolic ?? ""} onChange={set("systolic")} />
              <Field id="dia" label={t({ es: "Diastólica", en: "Diastolic" })} unit="mmHg" value={f.diastolic ?? ""} onChange={set("diastolic")} />
            </>)}
            {has("glucose") && <Field id="glu" label={t({ es: "Glucosa", en: "Glucose" })} unit="mg/dL" value={f.glucose ?? ""} onChange={set("glucose")} />}
            {has("cholesterol") && <Field id="chol" label={t({ es: "Colesterol", en: "Cholesterol" })} unit="mg/dL" value={f.cholesterol ?? ""} onChange={set("cholesterol")} />}
            {has("bmi") && (<>
              <Field id="w" label={t({ es: "Peso", en: "Weight" })} unit="kg" step="0.1" value={f.weight ?? ""} onChange={set("weight")} />
              <Field id="h" label={t({ es: "Altura", en: "Height" })} unit="cm" value={f.height ?? ""} onChange={set("height")} />
              <Field id="waist" label={t({ es: "Cintura", en: "Waist" })} unit="cm" value={f.waist ?? ""} onChange={set("waist")} />
            </>)}
            {has("vision") && <Field id="vis" label={t({ es: "Agudeza", en: "Acuity" })} step="0.1" value={f.vision ?? ""} onChange={set("vision")} />}
            {has("spo2") && <Field id="spo2" label="SpO₂" unit="%" value={f.spo2 ?? ""} onChange={set("spo2")} />}
          </div>
          <div className="mt-3 space-y-3">
            {has("ecg") && <Choice label="ECG" value={f.ecg ?? ""} onChange={set("ecg")} options={[{ id: "normal", label: t({ es: "Ritmo sinusal normal", en: "Normal sinus rhythm" }) }, { id: "review", label: t({ es: "Revisar", en: "Review" }) }]} />}
            {has("mole") && <Choice label={t({ es: "Lunares", en: "Moles" })} value={f.mole ?? ""} onChange={set("mole")} options={[{ id: "normal", label: t({ es: "Sin hallazgos", en: "No findings" }) }, { id: "watch", label: t({ es: "Vigilar", en: "Watch" }) }, { id: "refer", label: t({ es: "Derivar", en: "Refer" }) }]} />}
            {has("hearing") && <Choice label={t({ es: "Audición", en: "Hearing" })} value={f.hearing ?? ""} onChange={set("hearing")} options={[{ id: "normal", label: t({ es: "Normal", en: "Normal" }) }, { id: "review", label: t({ es: "Pérdida leve", en: "Mild loss" }) }]} />}
          </div>

          {/* live flags */}
          {filled > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-mist p-3 text-sm">
              {values.systolic && values.diastolic && <span className="flex items-center gap-1">{t({ es: "TA", en: "BP" })} {flag(worst([classify(RANGES.systolic, values.systolic), classify(RANGES.diastolic, values.diastolic)]))}</span>}
              {values.glucose && <span className="flex items-center gap-1">{t({ es: "Glu", en: "Glu" })} {flag(classify(RANGES.glucose, values.glucose))}</span>}
              {values.cholesterol && <span className="flex items-center gap-1">{t({ es: "Col", en: "Chol" })} {flag(classify(RANGES.cholesterol, values.cholesterol))}</span>}
              {values.bmi && <span className="flex items-center gap-1">{t({ es: "IMC", en: "BMI" })} {values.bmi} {flag(classify(RANGES.bmi, values.bmi))}</span>}
              {values.vision && <span className="flex items-center gap-1">{t({ es: "Vista", en: "Vision" })} {flag(classify(RANGES.vision, values.vision))}</span>}
              {values.spo2 && <span className="flex items-center gap-1">SpO₂ {flag(classify(RANGES.spo2, values.spo2))}</span>}
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">{t({ es: "Explicación para el trabajador", en: "Explanation for the worker" })}</h3>
              <Button size="sm" variant="soft" onClick={gen} disabled={!filled}><Wand2 />{t({ es: "Borrador en lenguaje claro", en: "Plain-language draft" })}</Button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["es", "en"] as const).map((lng) => (
                <label key={lng} className="block">
                  <span className="text-xs font-bold uppercase text-slate-500">{lng === "es" ? "Español" : "English"}</span>
                  <textarea value={summary[lng]} onChange={(e) => setSummary((s) => ({ ...s, [lng]: e.target.value }))} rows={5}
                    className="mt-1 w-full rounded-2xl border-2 border-slate-200 p-3 text-sm outline-none focus:border-violet-500" />
                </label>
              ))}
            </div>
            {steps.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-slate-700">{steps.map((s, i) => <li key={i}>{s[lang]}</li>)}</ul>
            )}
          </div>

          <Button className="mt-5 w-full" size="lg" variant="success" onClick={doPublish} disabled={!filled}>
            <ShieldCheck />{t({ es: "Validar y publicar resultados", en: "Validate & publish results" })}
          </Button>
        </>
      )}
    </div>
  );
}

/* ---------- documents & messages ---------- */
function DocsReview() {
  const { t, lang } = useLang();
  const docs = useStore((s) => s.documents);
  const review = useStore((s) => s.reviewDocument);
  const pending = docs.filter((d) => d.status === "pending");
  return (
    <div className="space-y-2">
      {!pending.length && <p className="rounded-2xl bg-mist p-4 text-sm text-slate-600">{t({ es: "No hay documentos pendientes. Sube uno desde 'Mi pase › Documentos' para probar.", en: "No pending documents. Upload one from 'My pass › Documents' to try it." })}</p>}
      {pending.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-3">
          <FileText className="size-6 text-amber-700" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{d.name}</p>
            <p className="text-xs text-slate-600">{ME.name} · {madridDate(new Date(d.uploadedAt), lang)} {madridClock(new Date(d.uploadedAt), lang)}</p>
          </div>
          <Button size="sm" variant="success" onClick={() => { review(d.id, "verified", CLINICIAN, { es: "Revisado y añadido a tu historial.", en: "Reviewed and added to your history." }); sfx("correct"); }}><ShieldCheck />{t({ es: "Verificar", en: "Verify" })}</Button>
          <Button size="sm" variant="outline" onClick={() => review(d.id, "rejected", CLINICIAN, { es: "La foto no se lee bien, ¿puedes repetirla?", en: "The photo isn't legible — could you retake it?" })}><X />{t({ es: "Pedir otra foto", en: "Request retake" })}</Button>
        </div>
      ))}
    </div>
  );
}

function Inbox() {
  const { t, lang } = useLang();
  const messages = useStore((s) => s.messages);
  const reply = useStore((s) => s.teamReply);
  const [text, setText] = useState("");
  const last = messages.slice(-6);
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{ME.name}</p>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-mist p-3">
        {last.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-sm", m.from === "me" ? "bg-white shadow-sm" : "ml-auto bg-ink text-white")}>
            <p className="text-[11px] font-bold opacity-70">{m.author} · {madridClock(new Date(m.at), lang)}</p>
            {typeof m.text === "string" ? m.text : t(m.text)}
          </div>
        ))}
      </div>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { reply(text.trim(), CLINICIAN); setText(""); sfx("tap"); } }}>
        <label htmlFor="pro-reply" className="sr-only">{t({ es: "Respuesta", en: "Reply" })}</label>
        <input id="pro-reply" value={text} onChange={(e) => setText(e.target.value)} placeholder={t({ es: "Responder a Lucía…", en: "Reply to Lucía…" })}
          className="min-h-12 flex-1 rounded-2xl border-2 border-slate-200 px-3 outline-none focus:border-violet-500" />
        <Button type="submit" size="icon" className="size-12" aria-label={t({ es: "Enviar", en: "Send" })}><Send /></Button>
      </form>
    </div>
  );
}

/* ---------- page ---------- */
export default function Pro() {
  const { t } = useLang();
  useTick(15000);
  const queue = useStore((s) => s.queue);
  const pass = useStore((s) => s.pass);
  const docs = useStore((s) => s.documents);
  const messages = useStore((s) => s.messages);
  const resetDemo = useStore((s) => s.resetDemo);
  const [unit, setUnit] = useState<string>(() => pass?.stopId ?? defaultStopId());
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const now = madridNow();

  // Follow the worker's pass to its unit when it is created/changed.
  useEffect(() => { if (pass?.stopId) setUnit(pass.stopId); }, [pass?.stopId]);

  const atUnit = queue.filter((x) => x.stopId === unit);
  const query = q.trim().toLowerCase();
  const list = (query ? queue.filter((x) => x.name.toLowerCase().includes(query) || x.code.toLowerCase().includes(query)) : atUnit)
    .slice()
    .sort((a, b) => {
      const rank = { "in-exam": 0, waiting: 1, done: 2 } as const;
      return rank[a.status] - rank[b.status] || Number(b.priority) - Number(a.priority) || a.checkedInAt - b.checkedInAt;
    });
  const selected = queue.find((x) => x.id === sel) ?? null;
  const stop = stopById(unit)!;
  const waitingN = atUnit.filter((x) => x.status === "waiting").length;
  const examN = atUnit.filter((x) => x.status === "in-exam").length;
  const doneN = atUnit.filter((x) => x.status === "done").length;
  const pendingDocs = docs.filter((d) => d.status === "pending").length;
  const unanswered = messages.at(-1)?.from === "me";
  const waitMin = (e: QueueEntry) => Math.max(0, Math.round((Date.now() - e.checkedInAt) / 60000));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <SectionTitle eyebrow={t({ es: "Espacio profesional", en: "Clinician workspace" })} title={`${CLINICIAN} · ${stop.name}`}
        sub={t({ es: "Cola en tiempo real, entrada rápida y validación. Se sincroniza al instante con la app del trabajador.", en: "Real-time queue, rapid entry and validation. Syncs instantly with the worker's app." })} />

      <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label={t({ es: "Unidad activa", en: "Active unit" })}>
        {STOPS.map((s) => {
          const open = openState(s.slots, now).kind === "open";
          return (
            <button key={s.id} onClick={() => { setUnit(s.id); setSel(null); }} aria-pressed={unit === s.id}
              className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3 text-sm font-bold", unit === s.id ? "border-ink bg-ink text-white" : "border-slate-200")}>
              <LiveDot on={open} />{s.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
      <div className="grid flex-1 grid-cols-3 gap-2 sm:max-w-xl">
        {[
          { icon: Users, n: waitingN, l: t({ es: "En espera", en: "Waiting" }) },
          { icon: Timer, n: examN, l: t({ es: "En consulta", en: "In exam" }) },
          { icon: CircleCheck, n: doneN, l: t({ es: "Atendidos", en: "Seen" }) },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl bg-mist p-3"><k.icon className="size-4 text-violet-600" /><p className="text-2xl font-black">{k.n}</p><p className="text-xs font-semibold text-slate-600">{k.l}</p></div>
        ))}
      </div>
        <Button variant="ghost" size="sm" onClick={() => { if (confirm(t({ es: "¿Reiniciar todos los datos de la demo?", en: "Reset all demo data?" }))) { resetDemo(); setSel(null); } }}>
          <RotateCcw />{t({ es: "Reiniciar demo", en: "Reset demo" })}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <label className="relative block">
            <span className="sr-only">{t({ es: "Buscar por nombre o código", en: "Search by name or code" })}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t({ es: "Nombre o código de 6 caracteres", en: "Name or 6-character code" })}
              className="min-h-12 w-full rounded-2xl border-2 border-slate-200 pl-10 pr-3 outline-none focus:border-violet-500" />
          </label>
          <ul className="space-y-2" aria-live="polite">
            {list.map((e) => (
              <li key={e.id}>
                <button onClick={() => setSel(e.id)}
                  className={cn("w-full rounded-2xl border-2 p-3 text-left transition-all",
                    sel === e.id ? "border-pink-500 bg-pink-50/40" : "border-slate-200 hover:border-slate-300",
                    e.isMe && sel !== e.id && "border-violet-300 bg-violet-50/50",
                    e.status === "done" && "opacity-60")}>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">{e.name}</span>
                    {e.priority && <Zap className="size-4 text-pink-600" aria-label={t({ es: "Prioritario", en: "Priority" })} />}
                    <span className="ml-auto font-mono text-sm font-bold tracking-widest text-slate-500">{e.code}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                    <span>{t(e.job)}</span>
                    {query && <span>· {stopById(e.stopId)?.name}</span>}
                    <span className="ml-auto flex items-center gap-1"><Clock className="size-3.5" />{waitMin(e)} min</span>
                    <Badge variant={e.status === "waiting" ? "default" : e.status === "in-exam" ? "violet" : "normal"}>
                      {e.status === "waiting" ? t({ es: "Espera", en: "Waiting" }) : e.status === "in-exam" ? t({ es: "Consulta", en: "Exam" }) : t({ es: "Hecho", en: "Done" })}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
            {!list.length && <li className="rounded-2xl bg-mist p-4 text-center text-sm text-slate-600">{t({ es: "Sin pacientes.", en: "No patients." })}</li>}
          </ul>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            {selected ? <PatientPanel entry={selected} /> : (
              <div className="grid min-h-60 place-items-center text-center text-slate-500">
                <div><UserRound className="mx-auto size-10 text-violet-300" /><p className="mt-2 font-semibold">{t({ es: "Selecciona un paciente de la cola", en: "Select a patient from the queue" })}</p></div>
              </div>
            )}
          </Card>
          <Card className="p-5">
            <Tabs defaultValue="docs">
              <TabsList>
                <TabsTrigger value="docs"><FileText />{t({ es: "Documentos", en: "Documents" })}{pendingDocs > 0 && <span className="grid size-5 place-items-center rounded-full bg-amber-500 text-[10px] text-white">{pendingDocs}</span>}</TabsTrigger>
                <TabsTrigger value="msgs"><MessageCircle />{t({ es: "Mensajes", en: "Messages" })}{unanswered && <span className="size-2 rounded-full bg-pink-500" />}</TabsTrigger>
              </TabsList>
              <TabsContent value="docs"><DocsReview /></TabsContent>
              <TabsContent value="msgs"><Inbox /></TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
