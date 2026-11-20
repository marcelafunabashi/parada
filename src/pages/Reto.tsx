import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Lock, Play, RotateCcw, Sparkles, Timer, Trophy, Zap, ArrowRight, ArrowLeft, Check, X, QrCode, Hand, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionTitle } from "@/components/brand";
import { useLang, type L } from "@/i18n";
import { useStore } from "@/store";
import { QUIZ, CATEGORY_LABEL, type QuizCard } from "@/data/quiz";
import { BADGES, TIERS, tierFor, READINESS_Q, recommendPack, type BadgeId, type JobType, type LastTest, type Symptom } from "@/data/game";
import { TESTS, totalMinutes } from "@/data/tests";
import { cn } from "@/lib/utils";
import { bigBurst, burst, sfx } from "@/lib/fx";

const SESSION_SECONDS = 60;

/* ------------------------------ Header stats ------------------------------ */
function StatsBar() {
  const { t } = useLang();
  const game = useStore((s) => s.game);
  const { current, next } = tierFor(game.xp);
  const base = current?.min ?? 0;
  const pct = next ? ((game.xp - base) / (next.min - base)) * 100 : 100;
  return (
    <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-14 place-items-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow", current ? current.color : "from-slate-300 to-slate-200")}>
          <Trophy className="size-7" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t({ es: "Tu nivel", en: "Your level" })}</p>
          <p className="text-lg font-black leading-tight">{current ? t(current.name) : t({ es: "Aprendiz de Parada", en: "Parada Rookie" })}</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm font-bold">
          <span><span className="text-brand text-xl font-black">{game.xp}</span> XP</span>
          {next && <span className="text-slate-500">{t({ es: `${next.min - game.xp} XP para ${next.name.es.replace("Pase Preventivo ", "")}`, en: `${next.min - game.xp} XP to ${next.name.en.replace(" Preventive Pass", "")}` })}</span>}
        </div>
        <Progress value={pct} className="mt-2 h-4" aria-label={t({ es: "Progreso de nivel", en: "Level progress" })} />
      </div>
      <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2">
        <Flame className={cn("size-8", game.streak > 0 ? "text-orange-500" : "text-slate-300")} />
        <div>
          <p className="text-2xl font-black leading-none">{game.streak}</p>
          <p className="text-xs font-bold text-orange-800">{t({ es: "días de racha", en: "day streak" })}</p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Quiz ------------------------------ */
type Phase = "idle" | "question" | "feedback" | "summary";

function SwipeCard({ card, onAnswer, disabled }: { card: QuizCard; onAnswer: (id: string) => void; disabled: boolean }) {
  const { t } = useLang();
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const binary = card.options.length === 2;

  const onDown = (e: React.PointerEvent) => {
    if (!binary || disabled) return;
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => { if (start.current !== null) setDx(e.clientX - start.current); };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx < -90) onAnswer(card.options[0].id);
    else if (dx > 90) onAnswer(card.options[1].id);
    setDx(0);
  };

  useEffect(() => {
    if (!binary || disabled) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onAnswer(card.options[0].id);
      if (e.key === "ArrowRight") onAnswer(card.options[1].id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [card, binary, disabled, onAnswer]);

  const hint = dx < -30 ? 0 : dx > 30 ? 1 : -1;

  return (
    <div
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={cn("relative touch-pan-y select-none rounded-[2rem] border-2 border-slate-200 bg-white p-6 shadow-xl animate-pop", binary && !disabled && "cursor-grab active:cursor-grabbing")}
      style={{ transform: `translateX(${dx}px) rotate(${dx / 18}deg)`, transition: start.current === null ? "transform .25s" : "none" }}
    >
      {binary && hint >= 0 && (
        <span className={cn("absolute top-5 rounded-xl border-4 px-3 py-1 text-xl font-black uppercase", hint === 0 ? "left-5 -rotate-12 border-rose-500 text-rose-500" : "right-5 rotate-12 border-emerald-500 text-emerald-500")}>
          {t(card.options[hint].label)}
        </span>
      )}
      <Badge variant="violet">{t(CATEGORY_LABEL[card.category])}</Badge>
      <div className="mt-4 text-6xl" aria-hidden>{card.emoji}</div>
      <h3 className="mt-4 text-2xl font-black leading-snug">{t(card.question)}</h3>
      <div className={cn("mt-6 grid gap-2", binary ? "grid-cols-2" : "grid-cols-1")}>
        {card.options.map((o, i) => (
          <Button key={o.id} size="lg" variant="outline" className="h-auto min-h-14 whitespace-normal py-3 text-left" onClick={() => onAnswer(o.id)} disabled={disabled}>
            {binary && i === 0 && <ArrowLeft className="hidden sm:block" />}
            {t(o.label)}
            {binary && i === 1 && <ArrowRight className="hidden sm:block" />}
          </Button>
        ))}
      </div>
      {binary && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
          <Hand className="size-3.5" />{t({ es: "Desliza o toca · ← → en teclado", en: "Swipe or tap · ← → on keyboard" })}
        </p>
      )}
    </div>
  );
}

function DoctorAvatar() {
  return (
    <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand text-2xl shadow-md" aria-hidden>
      👩‍⚕️
      <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-white text-[10px] font-black text-pink-600 ring-2 ring-white">P</span>
    </span>
  );
}

function Quiz() {
  const { t } = useLang();
  const answerQuiz = useStore((s) => s.answerQuiz);
  const answered = useStore((s) => s.game.answered);
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<QuizCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(SESSION_SECONDS);
  const [last, setLast] = useState<{ correct: boolean; picked: string } | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0, xp: 0, badges: [] as BadgeId[] });
  const [shake, setShake] = useState(false);

  const startGame = () => {
    // Unseen or previously missed cards first, then the rest, shuffled within each group.
    const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const fresh = shuffle(QUIZ.filter((q) => answered[q.id] !== true));
    const done = shuffle(QUIZ.filter((q) => answered[q.id] === true));
    setDeck([...fresh, ...done]);
    setIdx(0);
    setLeft(SESSION_SECONDS);
    setScore({ right: 0, total: 0, xp: 0, badges: [] });
    setLast(null);
    setPhase("question");
    sfx("tap");
  };

  const finish = useCallback(() => setPhase("summary"), []);

  // Timer only runs while a question is on screen (reading the explanation is free).
  useEffect(() => {
    if (phase !== "question") return;
    if (left <= 0) { finish(); return; }
    const i = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(i);
  }, [phase, left, finish]);

  useEffect(() => {
    if (phase === "summary" && score.badges.length) { sfx("level"); bigBurst(); }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const card = deck[idx];

  const onAnswer = useCallback((optId: string) => {
    if (phase !== "question" || !card) return;
    const correct = optId === card.correct;
    const res = answerQuiz(card.id, correct);
    setLast({ correct, picked: optId });
    setScore((s) => ({ right: s.right + (correct ? 1 : 0), total: s.total + 1, xp: s.xp + res.xpGained, badges: [...s.badges, ...res.newBadges] }));
    if (correct) { sfx("correct"); burst({ x: 0.5, y: 0.45 }); }
    else { sfx("wrong"); setShake(true); setTimeout(() => setShake(false), 450); }
    setPhase("feedback");
  }, [phase, card, answerQuiz]);

  const next = () => {
    if (idx + 1 >= deck.length || left <= 0) return finish();
    setIdx((i) => i + 1);
    setLast(null);
    setPhase("question");
  };

  if (phase === "idle") {
    return (
      <Card className="relative overflow-hidden bg-ink p-6 text-white sm:p-8">
        <div aria-hidden className="absolute -right-8 -top-8 size-48 rounded-full bg-brand opacity-40 blur-2xl" />
        <p className="relative text-xs font-bold uppercase tracking-widest text-pink-300">{t({ es: "El Minuto de Salud", en: "The Health Minute" })}</p>
        <h2 className="relative mt-2 text-3xl font-black">{t({ es: "¿Mito o verdad? Tienes 60 segundos.", en: "Myth or fact? You've got 60 seconds." })}</h2>
        <p className="relative mt-2 max-w-md text-slate-300">
          {t({ es: "Preguntas rápidas para tu pausa del café. Cada acierto suma XP, y la Dra. Ruiz te explica el porqué en dos frases.", en: "Quick questions for your coffee break. Every right answer earns XP, and Dr. Ruiz explains why in two sentences." })}
        </p>
        <Button size="lg" className="relative mt-6" onClick={startGame}><Play />{t({ es: "Empezar reto", en: "Start challenge" })}</Button>
      </Card>
    );
  }

  if (phase === "summary") {
    const pct = score.total ? Math.round((score.right / score.total) * 100) : 0;
    return (
      <Card className="p-6 text-center sm:p-8 animate-pop">
        <div className="text-6xl" aria-hidden>{pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "🌱"}</div>
        <h2 className="mt-3 text-3xl font-black">
          {pct >= 80 ? t({ es: "¡Crack de la salud!", en: "Health champion!" }) : pct >= 50 ? t({ es: "¡Muy bien!", en: "Nice work!" }) : t({ es: "¡Cada pregunta cuenta!", en: "Every question counts!" })}
        </h2>
        <p className="mt-1 text-slate-600">{t({ es: `${score.right} de ${score.total} aciertos`, en: `${score.right} of ${score.total} correct` })}</p>
        <p className="mt-4 text-5xl font-black text-brand">+{score.xp} XP</p>
        {score.badges.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-bold uppercase tracking-widest text-pink-600">{t({ es: "¡Nueva insignia!", en: "New badge!" })}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {score.badges.map((b) => (
                <div key={b} className={cn("rounded-3xl bg-gradient-to-br p-4 text-white shadow-lg animate-pop", BADGES[b].color)}>
                  <div className="text-4xl">{BADGES[b].emoji}</div>
                  <p className="mt-1 font-black">{t(BADGES[b].name)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button size="lg" onClick={startGame}><RotateCcw />{t({ es: "Otra ronda", en: "Play again" })}</Button>
          <Button size="lg" variant="outline" asChild><a href="#pack"><Sparkles />{t({ es: "Calcular mi chequeo ideal", en: "Find my ideal check-up" })}</a></Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-black", left <= 10 ? "bg-rose-100 text-rose-700" : "bg-violet-100 text-violet-800")} aria-live="off">
          <Timer className="size-4" />{left}s
        </div>
        <Progress value={(left / SESSION_SECONDS) * 100} className="h-2 flex-1" indicatorClassName={left <= 10 ? "bg-rose-500" : undefined} aria-label={t({ es: "Tiempo restante", en: "Time left" })} />
        <span className="text-sm font-bold text-slate-500">{idx + 1}/{deck.length}</span>
        <Button size="sm" variant="ghost" onClick={finish}>{t({ es: "Terminar", en: "Finish" })}</Button>
      </div>

      {card && (
        <div className={cn("relative", shake && "animate-shake")}>
          {/* stack illusion */}
          <div aria-hidden className="absolute inset-x-6 -bottom-3 h-full rounded-[2rem] bg-slate-200" />
          <div aria-hidden className="absolute inset-x-3 -bottom-1.5 h-full rounded-[2rem] bg-slate-100" />
          <div className="relative">
            <SwipeCard key={card.id} card={card} onAnswer={onAnswer} disabled={phase === "feedback"} />
          </div>
        </div>
      )}

      {phase === "feedback" && last && card && (
        <div role="status" className={cn("mt-6 rounded-3xl border-2 p-5 animate-slide-up", last.correct ? "border-emerald-300 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
          <p className={cn("flex items-center gap-2 text-xl font-black", last.correct ? "text-emerald-800" : "text-rose-800")}>
            {last.correct ? <Check className="size-6" /> : <X className="size-6" />}
            {last.correct ? t({ es: "¡Correcto!", en: "Correct!" }) : t({ es: `Casi… era «${t(card.options.find((o) => o.id === card.correct)!.label)}»`, en: `Almost… it was "${t(card.options.find((o) => o.id === card.correct)!.label)}"` })}
          </p>
          <div className="mt-3 flex gap-3">
            <DoctorAvatar />
            <div>
              <p className="text-xs font-extrabold text-pink-700">Dra. Carmen Ruiz · Parada</p>
              <p className="mt-0.5 leading-relaxed text-slate-800">{t(card.why)}</p>
            </div>
          </div>
          <Button size="lg" className="mt-4 w-full" onClick={next} autoFocus>
            {idx + 1 >= deck.length || left <= 0 ? t({ es: "Ver resultado", en: "See result" }) : t({ es: "Siguiente", en: "Next" })}<ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Readiness meter ------------------------------ */
function Gauge({ value }: { value: number }) {
  const { t } = useLang();
  const angle = -90 + (value / 100) * 180;
  const label: L = value < 35 ? { es: "Al día", en: "Up to date" } : value < 65 ? { es: "Toca pronto", en: "Due soon" } : { es: "¡Toca ya!", en: "Due now!" };
  return (
    <div className="relative mx-auto w-56">
      <svg viewBox="0 0 200 115" className="w-full" aria-hidden>
        <defs>
          <linearGradient id="gg" x1="0" x2="1">
            <stop offset="0" stopColor="#10b981" /><stop offset=".5" stopColor="#f59e0b" /><stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
        <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#gg)" strokeWidth="18" strokeLinecap="round" pathLength={100} strokeDasharray={`${value} 100`} style={{ transition: "stroke-dasharray .8s ease" }} />
        <g transform={`rotate(${angle} 100 100)`} style={{ transition: "transform .8s ease" }}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="9" fill="#0f172a" />
      </svg>
      <p className="-mt-1 text-center text-lg font-black" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={t({ es: "Urgencia de chequeo", en: "Check-up urgency" })}>{t(label)}</p>
    </div>
  );
}

function Readiness() {
  const { t } = useLang();
  const setPassTests = useStore((s) => s.setPassTests);
  const completeReadiness = useStore((s) => s.completeReadiness);
  const pass = useStore((s) => s.pass);
  const [step, setStep] = useState(0);
  const [last, setLast] = useState<LastTest | null>(null);
  const [job, setJob] = useState<JobType | null>(null);
  const [sym, setSym] = useState<Symptom | null>(null);
  const [added, setAdded] = useState(false);
  const rec = useMemo(() => (last && job && sym ? recommendPack(last, job, sym) : null), [last, job, sym]);

  const qs = [
    { key: "last", def: READINESS_Q.last, val: last, set: (v: string) => setLast(v as LastTest) },
    { key: "job", def: READINESS_Q.job, val: job, set: (v: string) => setJob(v as JobType) },
    { key: "sym", def: READINESS_Q.symptom, val: sym, set: (v: string) => setSym(v as Symptom) },
  ];

  const pick = (v: string) => {
    sfx("tap");
    qs[step].set(v);
    setTimeout(() => {
      setStep((s) => s + 1);
      if (step === 2) { completeReadiness(); sfx("level"); burst(); }
    }, 180);
  };
  const reset = () => { setStep(0); setLast(null); setJob(null); setSym(null); setAdded(false); };

  return (
    <Card id="pack" className="scroll-mt-24 overflow-hidden">
      <div className="bg-brand p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-white/80">{t({ es: "Calculadora de Chequeo Ideal", en: "Ideal Check-up Calculator" })}</p>
        <h2 className="text-2xl font-black">{t({ es: "Health Readiness Meter · 3 toques", en: "Health Readiness Meter · 3 taps" })}</h2>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < step ? "bg-white" : "bg-white/30")} />)}
        </div>
      </div>
      <div className="p-5">
        {step < 3 ? (
          <div key={step} className="animate-slide-up">
            <p className="text-sm font-bold text-slate-500">{step + 1}/3</p>
            <h3 className="mt-1 text-xl font-black">{t(qs[step].def.q)}</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {qs[step].def.opts.map((o) => (
                <button key={o.id} onClick={() => pick(o.id)} aria-pressed={qs[step].val === o.id}
                  className={cn("flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl border-2 p-3 text-center font-bold transition-all active:scale-95",
                    qs[step].val === o.id ? "border-pink-500 bg-pink-50" : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/40")}>
                  <span className="text-3xl" aria-hidden>{o.emoji}</span>
                  <span className="text-sm leading-tight">{t(o.label)}</span>
                </button>
              ))}
            </div>
            {step > 0 && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setStep((s) => s - 1)}><ArrowLeft />{t({ es: "Atrás", en: "Back" })}</Button>}
          </div>
        ) : rec && (
          <div className="animate-pop">
            <Gauge value={rec.urgency} />
            <div className="mt-4 rounded-3xl bg-ink p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-pink-300">{t({ es: "Tu Pack Recomendado", en: "Your Recommended Pack" })}</p>
              <p className="mt-1 text-2xl font-black">
                {t(rec.name)}: {rec.tests.map((id) => t(TESTS[id].short)).join(" + ")}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-orange-300"><Clock className="size-4" />~{totalMinutes(rec.tests)} {t({ es: "minutos", en: "minutes" })}</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {rec.reasons.map((r, i) => <li key={i} className="flex gap-2"><Sparkles className="mt-0.5 size-4 shrink-0 text-pink-500" />{t(r)}</li>)}
            </ul>
            {added ? (
              <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center">
                <p className="flex items-center gap-2 font-bold text-emerald-900"><Check className="size-5" />{t({ es: "Añadido a tu pase", en: "Added to your pass" })} · {pass?.code}</p>
                <Button asChild size="sm" variant="dark" className="sm:ml-auto"><Link to="/dashboard"><QrCode />{t({ es: "Ver mi pase", en: "View my pass" })}</Link></Button>
              </div>
            ) : (
              <Button size="lg" className="mt-5 w-full" onClick={() => { setPassTests(rec.tests, rec.name); setAdded(true); sfx("correct"); burst(); }}>
                <QrCode />{t({ es: "Añadir a mi Pase Digital", en: "Add to my Digital Pass" })}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={reset}><RotateCcw />{t({ es: "Volver a calcular", en: "Recalculate" })}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------ Rewards ------------------------------ */
function Rewards() {
  const { t } = useLang();
  const game = useStore((s) => s.game);
  const pass = useStore((s) => s.pass);
  const applyPriority = useStore((s) => s.applyPriority);
  const prevBadges = useRef(game.badges.length);
  useEffect(() => {
    if (game.badges.length > prevBadges.current) bigBurst();
    prevBadges.current = game.badges.length;
  }, [game.badges.length]);

  const days = Array.from({ length: 7 }, (_, i) => i < Math.min(game.streak, 7));

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Flame className="size-5 text-orange-500" />{t({ es: "Racha madrileña", en: "Madrid streak" })}</h2>
        <p className="text-sm text-slate-600">{t({ es: "Juega un minuto al día. 3 días seguidos = Semana Activa.", en: "Play one minute a day. 3 days in a row = Active Week." })}</p>
        <div className="mt-3 flex gap-1.5">
          {days.map((on, i) => (
            <span key={i} className={cn("grid h-11 flex-1 place-items-center rounded-xl text-lg", on ? "bg-gradient-to-b from-orange-400 to-pink-500 text-white" : "bg-slate-100 text-slate-300")}>{on ? "🔥" : "·"}</span>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Trophy className="size-5 text-amber-500" />{t({ es: "Pases preventivos y ventajas", en: "Preventive passes & perks" })}</h2>
        <ul className="mt-3 space-y-2">
          {TIERS.map((tier) => {
            const unlocked = game.xp >= tier.min;
            return (
              <li key={tier.id} className={cn("flex items-start gap-3 rounded-2xl border-2 p-3", unlocked ? "border-transparent bg-mist" : "border-dashed border-slate-200")}>
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", unlocked ? tier.color : "from-slate-200 to-slate-100 text-slate-400")}>
                  {unlocked ? <Trophy className="size-5" /> : <Lock className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{t(tier.name)} <span className="text-xs font-semibold text-slate-500">· {tier.min} XP</span></p>
                  <p className="text-sm font-bold text-violet-800">{t(tier.perk)}</p>
                  <p className="text-xs text-slate-600">{t(tier.perkDesc)}</p>
                  {tier.id === "silver" && unlocked && pass && pass.status !== "done" && !pass.priority && (
                    <Button size="sm" className="mt-2" onClick={() => { applyPriority(); sfx("correct"); burst(); }}><Zap />{t({ es: "Aplicar a mi pase", en: "Apply to my pass" })}</Button>
                  )}
                  {tier.id === "silver" && pass?.priority && <Badge variant="brand" className="mt-2"><Zap />{t({ es: "Activo en tu pase", en: "Active on your pass" })}</Badge>}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-pink-500" />{t({ es: "Insignias", en: "Badges" })}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
          {(Object.keys(BADGES) as BadgeId[]).map((id) => {
            const b = BADGES[id];
            const got = game.badges.includes(id);
            return (
              <div key={id} className={cn("rounded-2xl p-3 text-center", got ? cn("bg-gradient-to-br text-white shadow", b.color) : "bg-slate-100 text-slate-500")}>
                <div className={cn("text-3xl", !got && "grayscale opacity-40")} aria-hidden>{b.emoji}</div>
                <p className="mt-1 text-sm font-black">{t(b.name)}</p>
                <p className={cn("text-[11px] leading-tight", got ? "text-white/90" : "text-slate-500")}>{got ? t({ es: "¡Conseguida!", en: "Unlocked!" }) : t(b.how)}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default function Reto() {
  const { t } = useLang();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === "#pack") setTimeout(() => document.getElementById("pack")?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [hash]);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <SectionTitle
        eyebrow={t({ es: "Reto Parada 60s", en: "Parada 60s Challenge" })}
        title={t({ es: "Tu minuto de salud", en: "Your health minute" })}
        sub={t({ es: "Aprende jugando en tu descanso, suma racha y desbloquea ventajas reales en la unidad.", en: "Learn while you play on your break, build a streak and unlock real perks at the unit." })}
      />
      <StatsBar />
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-8">
          <Quiz />
          <Readiness />
        </div>
        <Rewards />
      </div>
    </div>
  );
}
