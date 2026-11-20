import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Droplet, Eye, HeartPulse, Ruler, Send, ScanFace, Wind, Ear, Stethoscope, CircleCheck, TriangleAlert, CircleAlert, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionTitle } from "@/components/brand";
import { RangeMeter } from "@/components/RangeMeter";
import { useLang, type L } from "@/i18n";
import { ME, useStore, type ResultValues } from "@/store";
import { RANGES, LEVEL_LABEL, classify, waistRange, worst, type Level } from "@/data/ranges";
import { stopById } from "@/data/stops";
import { madridClock, madridDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/fx";

const LEVEL_BADGE: Record<Level, "normal" | "warning" | "elevated"> = { normal: "normal", warning: "warning", elevated: "elevated" };
const LEVEL_ICON = { normal: CircleCheck, warning: TriangleAlert, elevated: CircleAlert };

const EXPLAIN: Record<string, Record<Level, L>> = {
  bp: {
    normal: { es: "Tu corazón empuja la sangre con una fuerza sana. Sigue así.", en: "Your heart pushes blood with healthy force. Keep it up." },
    warning: { es: "Un poco alta, pero aún no es hipertensión. Menos sal, más paseo y volver a medir en unos meses.", en: "A bit high, but not hypertension yet. Less salt, more walking and a recheck in a few months." },
    elevated: { es: "Está alta. Repite la medida otro día; si se mantiene, tu médico de cabecera debe valorarla.", en: "It's high. Recheck on another day; if it stays high, your GP should assess it." },
  },
  glucose: {
    normal: { es: "El azúcar en sangre está en su sitio.", en: "Your blood sugar is right where it should be." },
    warning: { es: "Algo alta. Puede ser 'prediabetes': se revierte con dieta y ejercicio. Conviene una analítica completa.", en: "Somewhat high. It may be 'prediabetes', which can be reversed with diet and exercise. A full blood test is advised." },
    elevated: { es: "Alta. Necesitas confirmarlo con una analítica en tu centro de salud pronto.", en: "High. You need to confirm it with a blood test at your health centre soon." },
  },
  cholesterol: {
    normal: { es: "Tus arterias están contentas.", en: "Your arteries are happy." },
    warning: { es: "Ligeramente alto. Menos embutido y bollería, más legumbre y fruta, y repetir en 6 meses.", en: "Slightly high. Fewer cured meats and pastries, more legumes and fruit, and recheck in 6 months." },
    elevated: { es: "Alto. Tu médico debe valorar tu riesgo cardiovascular con una analítica completa.", en: "High. Your doctor should assess your cardiovascular risk with a full blood test." },
  },
  bmi: {
    normal: { es: "Tu peso está en un rango saludable para tu altura.", en: "Your weight is in a healthy range for your height." },
    warning: { es: "Algo de sobrepeso o la cintura un poco por encima. Pequeños cambios suman: escaleras, agua, menos picoteo.", en: "Some extra weight or a slightly wide waist. Small changes add up: stairs, water, less snacking." },
    elevated: { es: "El peso o la cintura aumentan tu riesgo cardiovascular. Te podemos derivar a consejo nutricional gratuito.", en: "Weight or waist size raises your cardiovascular risk. We can refer you to free nutrition advice." },
  },
  vision: {
    normal: { es: "Ves de lejos con normalidad.", en: "Your distance vision is normal." },
    warning: { es: "Has perdido algo de vista de lejos. Pásate por una óptica: quizá necesites gafas o actualizarlas.", en: "You've lost some distance vision. Visit an optician: you may need glasses or a new prescription." },
    elevated: { es: "La agudeza visual está baja. Si conduces, revísala antes de tu próxima ruta.", en: "Visual acuity is low. If you drive, get it checked before your next route." },
  },
  spo2: {
    normal: { es: "Tu sangre lleva oxígeno de sobra.", en: "Your blood carries plenty of oxygen." },
    warning: { es: "Algo baja. Puede deberse al frío en los dedos; la repetimos.", en: "A bit low. Cold fingers can cause it; we'll repeat it." },
    elevated: { es: "Baja. Requiere valoración médica hoy.", en: "Low. Needs medical assessment today." },
  },
};

interface Row { key: string; icon: typeof HeartPulse; title: L; level: Level; render: () => React.ReactNode; explain: L }

function buildRows(v: ResultValues): Row[] {
  const rows: Row[] = [];
  if (v.systolic && v.diastolic) {
    const lv = worst([classify(RANGES.systolic, v.systolic), classify(RANGES.diastolic, v.diastolic)]);
    rows.push({
      key: "bp", icon: HeartPulse, title: { es: "Tensión arterial", en: "Blood pressure" }, level: lv, explain: EXPLAIN.bp[lv],
      render: () => (
        <>
          <p className="text-3xl font-black">{v.systolic}/{v.diastolic} <span className="text-base font-semibold text-slate-500">mmHg</span></p>
          <RangeMeter def={RANGES.systolic} value={v.systolic!} />
          <RangeMeter def={RANGES.diastolic} value={v.diastolic!} />
        </>
      ),
    });
  }
  if (v.glucose) {
    const lv = classify(RANGES.glucose, v.glucose);
    rows.push({ key: "glucose", icon: Droplet, title: { es: "Glucosa", en: "Glucose" }, level: lv, explain: EXPLAIN.glucose[lv],
      render: () => (<><p className="text-3xl font-black">{v.glucose} <span className="text-base font-semibold text-slate-500">mg/dL</span></p><RangeMeter def={RANGES.glucose} value={v.glucose!} /></>) });
  }
  if (v.cholesterol) {
    const lv = classify(RANGES.cholesterol, v.cholesterol);
    rows.push({ key: "cholesterol", icon: Activity, title: { es: "Colesterol total", en: "Total cholesterol" }, level: lv, explain: EXPLAIN.cholesterol[lv],
      render: () => (<><p className="text-3xl font-black">{v.cholesterol} <span className="text-base font-semibold text-slate-500">mg/dL</span></p><RangeMeter def={RANGES.cholesterol} value={v.cholesterol!} /></>) });
  }
  if (v.bmi) {
    const wDef = waistRange(ME.sex);
    const lv = worst([classify(RANGES.bmi, v.bmi), ...(v.waist ? [classify(wDef, v.waist)] : [])]);
    rows.push({ key: "bmi", icon: Ruler, title: { es: "IMC y cintura", en: "BMI & waist" }, level: lv, explain: EXPLAIN.bmi[lv],
      render: () => (
        <>
          <p className="text-3xl font-black">{num(v.bmi)} <span className="text-base font-semibold text-slate-500">kg/m²</span>{v.waist && <span className="ml-3 text-xl">· {v.waist} cm</span>}</p>
          <RangeMeter def={RANGES.bmi} value={v.bmi!} />
          {v.waist && <RangeMeter def={wDef} value={v.waist} />}
        </>
      ) });
  }
  if (v.vision) {
    const lv = classify(RANGES.vision, v.vision);
    rows.push({ key: "vision", icon: Eye, title: { es: "Agudeza visual", en: "Visual acuity" }, level: lv, explain: EXPLAIN.vision[lv],
      render: () => (<><p className="text-3xl font-black">{num(v.vision)} <span className="text-base font-semibold text-slate-500">/ {num(1)}</span></p><RangeMeter def={RANGES.vision} value={v.vision!} /></>) });
  }
  if (v.spo2) {
    const lv = classify(RANGES.spo2, v.spo2);
    rows.push({ key: "spo2", icon: Wind, title: { es: "Saturación de oxígeno", en: "Oxygen saturation" }, level: lv, explain: EXPLAIN.spo2[lv],
      render: () => (<><p className="text-3xl font-black">{v.spo2} <span className="text-base font-semibold text-slate-500">%</span></p><RangeMeter def={RANGES.spo2} value={v.spo2!} /></>) });
  }
  if (v.ecg) {
    const lv: Level = v.ecg === "normal" ? "normal" : "warning";
    rows.push({ key: "ecg", icon: Stethoscope, title: { es: "Electrocardiograma", en: "Electrocardiogram" }, level: lv,
      explain: lv === "normal"
        ? { es: "Ritmo sinusal normal: tu corazón late de forma regular y ordenada.", en: "Normal sinus rhythm: your heart beats in a regular, orderly way." }
        : { es: "Hay un detalle que un cardiólogo debe mirar. No es urgente, pero no lo dejes pasar.", en: "There's a detail a cardiologist should look at. Not urgent, but don't let it slide." },
      render: () => <EcgTrace ok={lv === "normal"} /> });
  }
  if (v.mole) {
    const lv: Level = v.mole === "normal" ? "normal" : v.mole === "watch" ? "warning" : "elevated";
    rows.push({ key: "mole", icon: ScanFace, title: { es: "Revisión de lunares", en: "Mole screening" }, level: lv,
      explain: {
        normal: { es: "Ningún lunar con signos de alarma.", en: "No moles with warning signs." },
        warning: { es: "Un lunar a vigilar: no es preocupante hoy, pero queremos compararlo en 3 meses.", en: "One mole to watch: not worrying today, but we want to compare it in 3 months." },
        elevated: { es: "Te derivamos a dermatología para revisar un lunar con más detalle.", en: "We're referring you to dermatology to look at a mole in more detail." },
      }[lv],
      render: () => <p className="text-xl font-black">{t2(lv === "normal" ? { es: "Sin hallazgos", en: "No findings" } : lv === "warning" ? { es: "1 lunar a vigilar", en: "1 mole to watch" } : { es: "Derivación a dermatología", en: "Dermatology referral" })}</p> });
  }
  if (v.hearing) {
    const lv: Level = v.hearing === "normal" ? "normal" : "warning";
    rows.push({ key: "hearing", icon: Ear, title: { es: "Audición", en: "Hearing" }, level: lv,
      explain: lv === "normal" ? { es: "Oyes bien en todas las frecuencias probadas.", en: "You hear well across all tested frequencies." } : { es: "Pérdida leve en frecuencias altas. Usa protección auditiva si trabajas con ruido.", en: "Mild loss at high frequencies. Wear hearing protection if you work around noise." },
      render: () => <p className="text-xl font-black">{t2(lv === "normal" ? { es: "Audición normal", en: "Normal hearing" } : { es: "Pérdida leve", en: "Mild loss" })}</p> });
  }
  return rows;
}

const num = (n: number | undefined, digits = 1) =>
  n === undefined ? "" : n.toLocaleString(useStore.getState().lang === "es" ? "es-ES" : "en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Small hack so render closures can translate without hooks: language is read at render time.
function t2(l: L) { return l[useStore.getState().lang]; }

function EcgTrace({ ok }: { ok: boolean }) {
  return (
    <svg viewBox="0 0 300 60" className="h-16 w-full" aria-hidden>
      <path
        d="M0 30 L40 30 L48 26 L56 30 L64 30 L70 6 L76 52 L82 30 L100 30 L112 22 L124 30 L160 30 L168 26 L176 30 L184 30 L190 6 L196 52 L202 30 L220 30 L232 22 L244 30 L300 30"
        fill="none" stroke={ok ? "#10b981" : "#f59e0b"} strokeWidth="2.5" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------- Q&A ---------------------------- */
function autoAnswer(q: string): L {
  const s = q.toLowerCase();
  if (/(tensi|presi|pressure|bp)/.test(s))
    return { es: "Tu 132/84 está en zona 'a vigilar', no es hipertensión. Lo ideal es repetirla en 3 meses, en reposo y sin café antes. Si quieres, pásate por cualquier Parada: son 3 minutos.", en: "Your 132/84 is in the 'watch' zone, not hypertension. Ideally recheck it in 3 months, rested and without coffee beforehand. Drop by any Parada: it takes 3 minutes." };
  if (/(colest|cholest|grasa|fat)/.test(s))
    return { es: "Un colesterol de 214 es ligeramente alto. Con cambios en la dieta suele bajar en unos meses. Repetiremos en 6 meses; si sigue igual, tu médico de cabecera valorará una analítica completa.", en: "A cholesterol of 214 is slightly high. Diet changes usually bring it down in a few months. We'll recheck in 6 months; if unchanged, your GP will consider a full blood panel." };
  if (/(lunar|mole|piel|skin|mancha)/.test(s))
    return { es: "El lunar del hombro es simétrico y de color uniforme, por eso no nos preocupa hoy. Hazle una foto cada mes con buena luz y súbela en 'Documentos' si cambia.", en: "The shoulder mole is symmetrical and evenly coloured, so it doesn't worry us today. Take a photo each month in good light and upload it under 'Documents' if it changes." };
  if (/(gafa|vista|visi|ojo|glasses|eye)/.test(s))
    return { es: "Has bajado a 0,8 de lejos. No es grave, pero unas gafas pueden evitar dolor de cabeza y cansancio al final del turno.", en: "Your distance vision is 0.8. Not serious, but glasses can prevent headaches and fatigue at the end of your shift." };
  if (/(ayun|fast|comer|eat)/.test(s))
    return { es: "Para glucosa y colesterol, lo ideal son 8 horas sin comer. Agua sí, café no. Las paradas de primera hora (Mercamadrid, Villaverde, Atocha) son perfectas para eso.", en: "For glucose and cholesterol, 8 hours without food is ideal. Water yes, coffee no. Early stops (Mercamadrid, Villaverde, Atocha) are perfect for that." };
  if (/(baja|sick|médic|doctor|cabecera|gp)/.test(s))
    return { es: "Nada de lo que vimos requiere baja ni ir hoy al médico. Si quieres, podemos enviar el informe a tu centro de salud: solo dínoslo aquí.", en: "Nothing we saw requires sick leave or seeing a doctor today. If you'd like, we can send the report to your health centre — just tell us here." };
  return { es: "¡Gracias por tu pregunta! La Dra. Ruiz la revisará en su próxima pausa y te responderá hoy mismo por aquí.", en: "Thanks for your question! Dr. Ruiz will review it on her next break and reply here today." };
}

function QAThread() {
  const { t, lang } = useLang();
  const messages = useStore((s) => s.messages);
  const send = useStore((s) => s.sendMessage);
  const reply = useStore((s) => s.teamReply);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length, typing]);

  const submit = (q: string) => {
    if (!q.trim()) return;
    send(q.trim());
    setText("");
    sfx("tap");
    setTyping(true);
    setTimeout(() => {
      // Only auto-reply if a clinician hasn't already answered from the Pro workspace.
      const last = useStore.getState().messages.at(-1);
      if (last?.from === "me") reply(autoAnswer(q), "Enf. Álvaro Gil · Parada");
      setTyping(false);
    }, 2600);
  };

  const suggestions: L[] = [
    { es: "¿Es grave mi tensión?", en: "Is my blood pressure serious?" },
    { es: "¿Qué hago con el colesterol?", en: "What should I do about cholesterol?" },
    { es: "¿Cómo vigilo el lunar?", en: "How do I monitor the mole?" },
  ];

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-lg font-extrabold">{t({ es: "Pregunta al equipo médico", en: "Ask the medical team" })}</h2>
        <p className="text-sm text-slate-600">{t({ es: "Respondemos en el día, en lenguaje claro.", en: "We reply the same day, in plain language." })}</p>
      </div>
      <div className="max-h-[26rem] min-h-60 space-y-3 overflow-y-auto bg-mist p-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex animate-slide-up", m.from === "me" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-3xl px-4 py-3 text-sm", m.from === "me" ? "rounded-br-md bg-ink text-white" : "rounded-bl-md bg-white shadow-sm")}>
              {m.from === "team" && <p className="mb-1 text-xs font-extrabold text-pink-600">{m.author}</p>}
              <p className="leading-relaxed">{typeof m.text === "string" ? m.text : t(m.text)}</p>
              <p className={cn("mt-1 text-[10px]", m.from === "me" ? "text-slate-400" : "text-slate-400")}>{madridDate(new Date(m.at), lang)} · {madridClock(new Date(m.at), lang)}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 rounded-3xl bg-white px-4 py-3 shadow-sm w-fit" aria-label={t({ es: "Escribiendo…", en: "Typing…" })}>
            {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 120}ms` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 pt-3">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => submit(t(s))} className="min-h-11 shrink-0 rounded-full border-2 border-violet-200 px-3 text-sm font-semibold text-violet-800 hover:bg-violet-50">{t(s)}</button>
        ))}
      </div>
      <form className="flex gap-2 p-4" onSubmit={(e) => { e.preventDefault(); submit(text); }}>
        <label htmlFor="qa" className="sr-only">{t({ es: "Tu pregunta", en: "Your question" })}</label>
        <input id="qa" value={text} onChange={(e) => setText(e.target.value)} placeholder={t({ es: "Escribe tu duda…", en: "Type your question…" })}
          className="min-h-12 flex-1 rounded-2xl border-2 border-slate-200 px-4 text-base outline-none focus:border-violet-500" />
        <Button type="submit" size="icon" className="size-12" aria-label={t({ es: "Enviar", en: "Send" })}><Send /></Button>
      </form>
    </Card>
  );
}

/* ---------------------------- Page ---------------------------- */
export default function Results() {
  const { t, lang } = useLang();
  const results = useStore((s) => s.results);
  const [selId, setSelId] = useState<string | null>(null);
  const r = results.find((x) => x.id === selId) ?? results[0];
  useEffect(() => { setSelId(null); }, [results.length]);
  const rows = useMemo(() => (r ? buildRows(r.values) : []), [r, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 text-center">
        <p>{t({ es: "Aún no tienes resultados.", en: "You don't have results yet." })}</p>
        <Button asChild className="mt-4"><Link to="/locator">{t({ es: "Encuentra tu parada", en: "Find your stop" })}</Link></Button>
      </div>
    );
  }
  const counts = { normal: 0, warning: 0, elevated: 0 } as Record<Level, number>;
  rows.forEach((x) => counts[x.level]++);
  const stop = stopById(r.stopId);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <SectionTitle
        eyebrow={t({ es: "Resultados explicados", en: "Results, explained" })}
        title={t({ es: "Tu último chequeo", en: "Your latest check-up" })}
        sub={`${madridDate(new Date(r.date), lang)} · ${stop?.name ?? ""}`}
      />

      {results.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto" role="group" aria-label={t({ es: "Chequeos", en: "Check-ups" })}>
          {results.map((x) => (
            <button key={x.id} onClick={() => setSelId(x.id)} aria-pressed={x.id === r.id}
              className={cn("min-h-11 shrink-0 rounded-full border-2 px-4 text-sm font-bold", x.id === r.id ? "border-ink bg-ink text-white" : "border-slate-200")}>
              {madridDate(new Date(x.date), lang)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {/* Doctor */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-4 bg-brand p-5 text-white">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-lg font-black text-pink-600">
                {r.doctor.replace(/^(Dra?\.|Dr\.|Enf\.)\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">{t({ es: "Te lo explica", en: "Explained by" })}</p>
                <p className="text-xl font-black">{r.doctor}</p>
                <p className="flex items-center gap-1 text-sm text-white/90"><MapPin className="size-3.5" />{t({ es: "Médica de familia · Unidad ", en: "Family doctor · Unit " })}{stop?.name}</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-lg leading-relaxed">“{t(r.summary)}”</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="normal"><CircleCheck />{counts.normal} {t(LEVEL_LABEL.normal).toLowerCase()}</Badge>
                <Badge variant="warning"><TriangleAlert />{counts.warning} {t(LEVEL_LABEL.warning).toLowerCase()}</Badge>
                <Badge variant="elevated"><CircleAlert />{counts.elevated} {t(LEVEL_LABEL.elevated).toLowerCase()}</Badge>
              </div>
              {r.nextSteps.length > 0 && (
                <>
                  <h3 className="mt-5 font-extrabold">{t({ es: "Tus siguientes pasos", en: "Your next steps" })}</h3>
                  <ol className="mt-2 space-y-2">
                    {r.nextSteps.map((s, i) => (
                      <li key={i} className="flex gap-3 rounded-2xl bg-mist p-3 text-sm">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-black text-white">{i + 1}</span>{t(s)}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </Card>

          {/* Test cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => {
              const Icon = LEVEL_ICON[row.level];
              return (
                <Card key={row.key} className={cn("p-5", row.level === "elevated" && "border-rose-200", row.level === "warning" && "border-amber-200")}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 font-extrabold"><row.icon className="size-5 text-violet-600" />{t(row.title)}</h3>
                    <Badge variant={LEVEL_BADGE[row.level]}><Icon />{t(LEVEL_LABEL[row.level])}</Badge>
                  </div>
                  <div className="mt-3">{row.render()}</div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="x" className="border-0">
                      <AccordionTrigger className="text-sm text-violet-700">{t({ es: "¿Qué significa?", en: "What does it mean?" })}</AccordionTrigger>
                      <AccordionContent>{t(row.explain)}</AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            {t({
              es: "Pruebas de cribado rápido con sangre capilar. No sustituyen a un diagnóstico; ante valores alterados te derivamos a tu centro de salud.",
              en: "Rapid screening tests using capillary blood. They are not a diagnosis; for abnormal values we refer you to your health centre.",
            })}
          </p>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <QAThread />
        </div>
      </div>
    </div>
  );
}
