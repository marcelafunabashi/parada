import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Camera, Check, CircleCheck, Clock, FileText, Hourglass, MapPin, QrCode, ScanLine, ShieldCheck, Syringe, Upload,
  CalendarClock, History, Zap, X, FileHeart, Sparkles, TriangleAlert, LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineBadge, OpenPill, SectionTitle } from "@/components/brand";
import { useLang, type L } from "@/i18n";
import { useStore, madridDateKey, type DocKind, type PassStatus } from "@/store";
import { stopById } from "@/data/stops";
import { TESTS, totalMinutes } from "@/data/tests";
import { tierFor } from "@/data/game";
import { madridDate } from "@/lib/time";
import { cn, formatMinutes } from "@/lib/utils";
import { burst, sfx } from "@/lib/fx";

const STATUS_STEPS: { id: PassStatus; label: L }[] = [
  { id: "ready", label: { es: "Pase listo", en: "Pass ready" } },
  { id: "queued", label: { es: "En cola", en: "In queue" } },
  { id: "in-exam", label: { es: "En consulta", en: "With clinician" } },
  { id: "done", label: { es: "Resultados", en: "Results" } },
];

const VACCINES: { name: L; date: L; status: "ok" | "due" }[] = [
  { name: { es: "Gripe (temporada 2025-26)", en: "Flu (2025-26 season)" }, date: { es: "Oct 2025", en: "Oct 2025" }, status: "due" },
  { name: { es: "COVID-19 (refuerzo)", en: "COVID-19 (booster)" }, date: { es: "Oct 2025", en: "Oct 2025" }, status: "ok" },
  { name: { es: "Tétanos-difteria (Td)", en: "Tetanus-diphtheria (Td)" }, date: { es: "May 2019", en: "May 2019" }, status: "ok" },
  { name: { es: "Hepatitis B (3 dosis)", en: "Hepatitis B (3 doses)" }, date: { es: "2004", en: "2004" }, status: "ok" },
];

const DOC_KINDS: { id: DocKind; label: L }[] = [
  { id: "analysis", label: { es: "Analítica", en: "Lab test" } },
  { id: "prescription", label: { es: "Receta", en: "Prescription" } },
  { id: "report", label: { es: "Informe", en: "Report" } },
  { id: "vaccine", label: { es: "Vacuna", en: "Vaccine" } },
];

function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(), a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const val = a + (target - a) * (1 - Math.pow(1 - p, 3));
      setV(val);
      if (p < 1) raf = requestAnimationFrame(step); else from.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/* ------------------------------- Pass ------------------------------- */
function PassCard() {
  const { t } = useLang();
  const pass = useStore((s) => s.pass)!;
  const queue = useStore((s) => s.queue);
  const xp = useStore((s) => s.game.xp);
  const checkIn = useStore((s) => s.checkIn);
  const cancelPass = useStore((s) => s.cancelPass);
  const applyPriority = useStore((s) => s.applyPriority);
  const stop = stopById(pass.stopId)!;
  const stepIdx = STATUS_STEPS.findIndex((s) => s.id === pass.status);
  const canPriority = (tierFor(xp).current?.min ?? 0) >= 100;

  const waiting = queue
    .filter((q) => q.stopId === pass.stopId && q.status === "waiting")
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.checkedInAt - b.checkedInAt);
  const pos = waiting.findIndex((q) => q.isMe && q.code === pass.code);

  return (
    <Card className="overflow-hidden border-0 bg-ink text-white shadow-2xl shadow-violet-900/30">
      <div className="h-2 bg-brand" />
      <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-7">
        <div className="mx-auto flex flex-col items-center">
          <div className="rounded-3xl bg-white p-4">
            <QRCodeSVG value={`PARADA:${pass.code}:${pass.stopId}`} size={176} level="M" fgColor="#0f172a" aria-label={t({ es: "Código QR de tu pase", en: "Your pass QR code" })} />
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-400">{t({ es: "Código rápido", en: "Fast-entry code" })}</p>
          <p className="font-mono text-4xl font-black tracking-[0.25em]" aria-label={pass.code.split("").join(" ")}>{pass.code}</p>
          {pass.priority && <Badge variant="brand" className="mt-2"><Zap />{t({ es: "Prioritario de Turno", en: "Shift Priority" })}</Badge>}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {stop.lines.map((l) => <LineBadge key={l} id={l} size="sm" />)}
            <h2 className="text-2xl font-black">{stop.name}</h2>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-300"><MapPin className="size-4" />{t(stop.spot)}</p>
          <OpenPill slots={stop.slots} className="mt-3 bg-white/10 text-white" />
          {pass.pack && <p className="mt-3 text-sm font-bold text-pink-300"><Sparkles className="mr-1 inline size-4" />{t(pass.pack)}</p>}

          {/* status timeline */}
          <ol className="mt-5 grid grid-cols-4 gap-1" aria-label={t({ es: "Estado del pase", en: "Pass status" })}>
            {STATUS_STEPS.map((s, i) => (
              <li key={s.id} className="text-center">
                <div className={cn("h-1.5 rounded-full", i <= stepIdx ? "bg-brand" : "bg-white/15")} />
                <p className={cn("mt-1.5 text-[11px] font-bold leading-tight", i === stepIdx ? "text-white" : "text-slate-400")} aria-current={i === stepIdx ? "step" : undefined}>{t(s.label)}</p>
              </li>
            ))}
          </ol>

          <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-400">{t({ es: "Tus pruebas", en: "Your tests" })} · ~{totalMinutes(pass.tests)} min</h3>
          <ul className="mt-2 grid grid-cols-2 gap-1.5">
            {pass.tests.map((id) => (
              <li key={id} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">
                <Check className="size-4 shrink-0 text-emerald-400" />{t(TESTS[id].short)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 p-5 sm:px-7">
        {pass.status === "ready" && (
          <>
            <h3 className="font-extrabold">{t({ es: "Cómo usar tu pase", en: "How to use your pass" })}</h3>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-300">
              <li>1. {t({ es: "Sube a la unidad y enseña el QR en la tablet de la entrada (o di tu código).", en: "Step into the unit and show the QR at the entrance tablet (or say your code)." })}</li>
              <li>2. {t({ es: "Espera tu turno: te avisamos aquí cuando te toque.", en: "Wait for your turn: we'll notify you here when it's time." })}</li>
              <li>3. {t({ es: "Sigue las indicaciones de preparación de cada prueba.", en: "Follow the prep notes for each test." })}</li>
            </ol>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => { checkIn(); sfx("level"); burst(); }}><ScanLine />{t({ es: "Simular escaneo en la unidad", en: "Simulate scan at the unit" })}</Button>
              <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={cancelPass}><X />{t({ es: "Cancelar pase", en: "Cancel pass" })}</Button>
            </div>
          </>
        )}
        {pass.status === "queued" && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand text-3xl font-black">{pos >= 0 ? pos + 1 : "–"}</span>
              <div>
                <p className="text-lg font-extrabold">{t({ es: "Tu posición en la cola", en: "Your place in the queue" })}</p>
                <p className="text-sm text-slate-300">{t({ es: `≈ ${Math.max(1, pos) * 5} min · te avisamos aquí`, en: `≈ ${Math.max(1, pos) * 5} min · we'll notify you here` })}</p>
              </div>
            </div>
            {!pass.priority && (
              <Button
                className="sm:ml-auto"
                variant={canPriority ? "brand" : "outline"}
                disabled={!canPriority}
                onClick={() => { applyPriority(); sfx("correct"); burst(); }}
              >
                <Zap />
                {canPriority ? t({ es: "Usar Pase Prioritario", en: "Use Priority Pass" }) : t({ es: "Prioritario: nivel Plata", en: "Priority: Silver level" })}
              </Button>
            )}
          </div>
        )}
        {pass.status === "in-exam" && (
          <p className="flex items-center gap-3 text-lg font-extrabold"><LoaderCircle className="size-6 animate-spin text-pink-400" />{t({ es: "¡Te toca! Pasa a la consulta.", en: "It's your turn! Step into the exam room." })}</p>
        )}
        {pass.status === "done" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex items-center gap-2 text-lg font-extrabold"><CircleCheck className="size-6 text-emerald-400" />{t({ es: "Resultados listos y explicados", en: "Results ready and explained" })}</p>
            <Button asChild className="sm:ml-auto"><Link to="/results"><FileHeart />{t({ es: "Ver resultados", en: "View results" })}</Link></Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function NoPass() {
  const { t } = useLang();
  return (
    <Card className="border-2 border-dashed border-slate-300 p-8 text-center shadow-none">
      <QrCode className="mx-auto size-12 text-violet-500" />
      <h2 className="mt-3 text-xl font-black">{t({ es: "Aún no tienes un pase activo", en: "You don't have an active pass yet" })}</h2>
      <p className="mx-auto mt-1 max-w-md text-slate-600">
        {t({ es: "Elige una parada y tus pruebas, o deja que el Reto 60s te recomiende un pack a tu medida.", en: "Pick a stop and your tests, or let the 60s Challenge recommend a pack for you." })}
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild><Link to="/locator"><MapPin />{t({ es: "Elegir parada", en: "Choose a stop" })}</Link></Button>
        <Button asChild variant="outline"><Link to="/reto#pack"><Sparkles />{t({ es: "Recomiéndame un pack", en: "Recommend me a pack" })}</Link></Button>
      </div>
    </Card>
  );
}

/* --------------------------- Time saved --------------------------- */
function TimeSaved() {
  const { t, lang } = useLang();
  const visits = useStore((s) => s.visits);
  const clinic = useStore((s) => s.clinicMinutes);
  const setClinic = useStore((s) => s.setClinicMinutes);
  const year = madridDateKey().slice(0, 4);
  const thisYear = visits.filter((v) => madridDateKey(new Date(v.date)).startsWith(year));
  const saved = thisYear.reduce((acc, v) => acc + Math.max(0, clinic - v.minutes), 0);
  const anim = useCountUp(saved);
  const avg = thisYear.length ? Math.round(thisYear.reduce((a, v) => a + v.minutes, 0) / thisYear.length) : 0;

  return (
    <Card>
      <CardHeader>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-600"><Hourglass className="size-4" />{t({ es: "Tiempo ahorrado", en: "Time saved" })}</p>
        <CardTitle className="text-2xl">
          {t({ es: "Has ahorrado ", en: "You've saved " })}
          <span className="text-brand">{formatMinutes(anim, lang)}</span>
          {t({ es: " de trabajo este año", en: " of work this year" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-mist p-3"><p className="text-2xl font-black">{thisYear.length}</p><p className="text-xs font-semibold text-slate-600">{t({ es: "visitas", en: "visits" })}</p></div>
          <div className="rounded-2xl bg-mist p-3"><p className="text-2xl font-black">{avg}′</p><p className="text-xs font-semibold text-slate-600">{t({ es: "media Parada", en: "Parada avg." })}</p></div>
          <div className="rounded-2xl bg-mist p-3"><p className="text-2xl font-black">{formatMinutes(clinic, lang)}</p><p className="text-xs font-semibold text-slate-600">{t({ es: "centro de salud", en: "health centre" })}</p></div>
        </div>
        <label htmlFor="clinic" className="mt-5 block text-sm font-bold">
          {t({ es: "¿Cuánto te cuesta ir a tu centro de salud? (ida, espera y vuelta)", en: "How long does a health-centre visit cost you? (travel, wait, return)" })}
        </label>
        <input
          id="clinic"
          type="range"
          min={60}
          max={300}
          step={10}
          value={clinic}
          onChange={(e) => setClinic(Number(e.target.value))}
          className="mt-3 h-11 w-full cursor-pointer accent-pink-500"
          aria-valuetext={formatMinutes(clinic, lang)}
        />
        <div className="flex justify-between text-xs font-semibold text-slate-500"><span>1h</span><span>5h</span></div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Upload ------------------------------ */
function UploadBox() {
  const { t } = useLang();
  const upload = useStore((s) => s.uploadDocument);
  const [kind, setKind] = useState<DocKind>("analysis");
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
    setProgress(0);
    let p = 0;
    const i = setInterval(() => {
      p += 12 + Math.random() * 18;
      if (p >= 100) {
        clearInterval(i);
        setProgress(100);
        upload({ name: f.name, kind });
        sfx("correct");
        setTimeout(() => setProgress(null), 1600);
      } else setProgress(p);
    }, 180);
  };

  return (
    <div className="rounded-3xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-4">
      <p className="text-sm font-bold">{t({ es: "Sube un informe, receta o analítica para que la revise un profesional", en: "Upload a report, prescription or lab test for professional review" })}</p>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t({ es: "Tipo de documento", en: "Document type" })}>
        {DOC_KINDS.map((k) => (
          <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}
            className={cn("min-h-11 rounded-full border-2 px-3 text-sm font-semibold", kind === k.id ? "border-violet-600 bg-white text-violet-900" : "border-transparent bg-white/60 text-slate-600")}>
            {t(k.label)}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="dark" onClick={() => camRef.current?.click()}><Camera />{t({ es: "Hacer foto", en: "Take photo" })}</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload />{t({ es: "Subir archivo", en: "Upload file" })}</Button>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      {progress !== null && (
        <div className="mt-4 flex items-center gap-3 animate-slide-up" aria-live="polite">
          {preview ? <img src={preview} alt="" className="size-12 rounded-xl object-cover" /> : <FileText className="size-10 text-violet-500" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fileName}</p>
            <Progress value={progress} className="mt-1 h-2" />
            <p className="mt-1 text-xs text-slate-500">{progress >= 100 ? t({ es: "Enviado · pendiente de revisión", en: "Sent · pending review" }) : t({ es: "Cifrando y enviando…", en: "Encrypting and sending…" })}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function Dashboard() {
  const { t, lang } = useLang();
  const pass = useStore((s) => s.pass);
  const visits = useStore((s) => s.visits);
  const followUps = useStore((s) => s.followUps);
  const toggleFollowUp = useStore((s) => s.toggleFollowUp);
  const documents = useStore((s) => s.documents);
  const pending = followUps.filter((f) => !f.done).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <SectionTitle eyebrow={t({ es: "Hola, Lucía", en: "Hi, Lucía" })} title={t({ es: "Mi pase y mi salud", en: "My pass & health" })} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {pass ? <PassCard /> : <NoPass />}

          <Card>
            <CardHeader><CardTitle>{t({ es: "Mi historial", en: "My history" })}</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="visits">
                <TabsList>
                  <TabsTrigger value="visits"><History />{t({ es: "Visitas", en: "Visits" })}</TabsTrigger>
                  <TabsTrigger value="follow"><CalendarClock />{t({ es: "Seguimiento", en: "Follow-ups" })}{pending > 0 && <span className="grid size-5 place-items-center rounded-full bg-pink-500 text-[10px] text-white">{pending}</span>}</TabsTrigger>
                  <TabsTrigger value="vacc"><Syringe />{t({ es: "Vacunas", en: "Vaccines" })}</TabsTrigger>
                  <TabsTrigger value="docs"><FileText />{t({ es: "Documentos", en: "Documents" })}</TabsTrigger>
                </TabsList>

                <TabsContent value="visits">
                  <ul className="space-y-2">
                    {visits.map((v) => {
                      const s = stopById(v.stopId)!;
                      return (
                        <li key={v.id} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-violet-600"><MapPin className="size-5" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">{s.name} · <span className="font-semibold text-slate-500">{madridDate(new Date(v.date), lang)}</span></p>
                            <p className="truncate text-xs text-slate-600">{v.tests.map((x) => t(TESTS[x].short)).join(" · ")}</p>
                          </div>
                          <Badge variant="normal"><Clock />{v.minutes} min</Badge>
                        </li>
                      );
                    })}
                  </ul>
                </TabsContent>

                <TabsContent value="follow">
                  <ul className="space-y-2">
                    {followUps.map((f) => (
                      <li key={f.id}>
                        <button onClick={() => { toggleFollowUp(f.id); if (!f.done) sfx("correct"); }} aria-pressed={f.done}
                          className={cn("flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left", f.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200")}>
                          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg border-2", f.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300")}>{f.done && <Check className="size-4" />}</span>
                          <span className="flex-1">
                            <span className={cn("block font-bold", f.done && "line-through opacity-60")}>{t(f.title)}</span>
                            <span className="text-xs text-slate-600">{t(f.due)}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="vacc">
                  <ul className="space-y-2">
                    {VACCINES.map((v, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                        <Syringe className="size-5 shrink-0 text-violet-600" />
                        <div className="flex-1"><p className="font-bold">{t(v.name)}</p><p className="text-xs text-slate-600">{t({ es: "Última dosis: ", en: "Last dose: " })}{t(v.date)}</p></div>
                        {v.status === "ok"
                          ? <Badge variant="normal"><ShieldCheck />{t({ es: "Al día", en: "Up to date" })}</Badge>
                          : <Badge variant="warning"><TriangleAlert />{t({ es: "Toca renovar", en: "Due now" })}</Badge>}
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="docs" className="space-y-3">
                  <UploadBox />
                  <ul className="space-y-2">
                    {documents.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 rounded-2xl bg-mist p-3">
                        <FileText className="size-5 shrink-0 text-slate-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{d.name}</p>
                          <p className="text-xs text-slate-600">{t(DOC_KINDS.find((k) => k.id === d.kind)!.label)} · {madridDate(new Date(d.uploadedAt), lang)}{d.note ? ` · ${t(d.note)}` : ""}</p>
                        </div>
                        {d.status === "verified" && <Badge variant="normal"><ShieldCheck />{t({ es: "Verificado", en: "Verified" })}</Badge>}
                        {d.status === "pending" && <Badge variant="warning"><Hourglass />{t({ es: "En revisión", en: "In review" })}</Badge>}
                        {d.status === "rejected" && <Badge variant="elevated"><X />{t({ es: "Repetir foto", en: "Retake photo" })}</Badge>}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <TimeSaved />
          <Card className="bg-brand p-5 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-white/80">{t({ es: "Reto Parada 60s", en: "Parada 60s Challenge" })}</p>
            <p className="mt-1 text-xl font-black">{t({ es: "Suma puntos en tu descanso y desbloquea el Pase Prioritario de Turno.", en: "Earn points on your break and unlock the Shift Priority Pass." })}</p>
            <Button asChild variant="dark" className="mt-4"><Link to="/reto"><Sparkles />{t({ es: "Jugar", en: "Play" })}</Link></Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
