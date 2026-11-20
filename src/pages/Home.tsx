import { Link } from "react-router-dom";
import { ArrowRight, MapPin, QrCode, Stethoscope, MessageCircle, Timer, Briefcase, FlaskConical, Sparkles, Clock, Train } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LineBadge, LiveDot, OpenPill, useTick } from "@/components/brand";
import { useLang, type L } from "@/i18n";
import { STOPS, stopById, waitRange } from "@/data/stops";
import { ALL_TESTS } from "@/data/tests";
import { defaultStopId } from "@/store";
import { madridNow, openState } from "@/lib/time";

const STEPS: { icon: typeof MapPin; title: L; body: L }[] = [
  { icon: MapPin, title: { es: "Encuentra tu parada", en: "Find your stop" }, body: { es: "Mira rutas y horarios de las unidades junto a tu metro o tu trabajo.", en: "See routes and schedules of units by your metro or workplace." } },
  { icon: QrCode, title: { es: "Llega sin cita previa", en: "Walk in, no appointment" }, body: { es: "Check-in con QR en segundos. Sin papeles, sin esperas largas.", en: "QR check-in in seconds. No paperwork, no long waits." } },
  { icon: Stethoscope, title: { es: "Pruebas a tu medida", en: "Tests that fit you" }, body: { es: "Tensión, glucosa, ECG, colesterol, lunares… solo lo que necesitas.", en: "Blood pressure, glucose, ECG, cholesterol, moles… only what you need." } },
  { icon: MessageCircle, title: { es: "Resultados explicados", en: "Results, explained" }, body: { es: "Una médica te los explica en la app, sin jerga, con siguientes pasos.", en: "A doctor explains them in the app, jargon-free, with next steps." } },
];

const FAQ: { q: L; a: L }[] = [
  { q: { es: "¿Cuánto cuesta?", en: "How much does it cost?" }, a: { es: "Nada. El piloto de Madrid es gratuito para trabajadores por turnos y por horas.", en: "Nothing. The Madrid pilot is free for shift and hourly workers." } },
  { q: { es: "¿Necesito tarjeta sanitaria?", en: "Do I need a health card?" }, a: { es: "No es obligatoria. Si la traes, podemos enviar tus resultados a tu centro de salud con tu permiso.", en: "Not required. If you bring it, we can send your results to your health centre with your permission." } },
  { q: { es: "¿Quién me atiende?", en: "Who sees me?" }, a: { es: "Enfermeras y médicos colegiados. Cada resultado lo revisa y explica una persona, no un algoritmo.", en: "Licensed nurses and doctors. Every result is reviewed and explained by a person, not an algorithm." } },
  { q: { es: "¿Y si sale algo alterado?", en: "What if something comes back abnormal?" }, a: { es: "Te lo explicamos en el momento y te derivamos a tu médico de cabecera con un informe. Si es urgente, te acompañamos.", en: "We explain it on the spot and refer you to your GP with a report. If it's urgent, we stay with you." } },
];

export default function Home() {
  const { t } = useLang();
  useTick(30000);
  const now = madridNow();
  const nearest = stopById(defaultStopId())!;
  const st = openState(nearest.slots, now);
  const openCount = STOPS.filter((s) => openState(s.slots, now).kind === "open").length;
  const [wLo, wHi] = waitRange(nearest);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-brand opacity-20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -left-40 top-40 size-[26rem] rounded-full bg-violet-400 opacity-10 blur-3xl" />
        <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 pb-12 pt-8 sm:pt-14 lg:pb-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <Badge variant="dark" className="mb-5 gap-2 px-3 py-1.5 text-xs">
              <LiveDot on={openCount > 0} />
              {t({ es: "Piloto Madrid · 9 paradas rotativas en Madrid", en: "Madrid pilot · 9 rotating stops across Madrid" })}
            </Badge>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              {t({ es: "Tu chequeo, ", en: "Your check-up, " })}
              <span className="text-brand">{t({ es: "a la vuelta del trabajo", en: "right around the corner from work" })}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              {t({
                es: "Unidades médicas móviles en tu intercambiador o junto a tu obra. Pruebas preventivas en menos de 20 minutos, sin cita y sin perder horas de turno.",
                en: "Mobile medical units at your transit hub or next to your site. Preventive tests in under 20 minutes, no appointment and no lost shift hours.",
              })}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/locator"><MapPin />{t({ es: "Encuentra tu parada hoy", en: "Find your stop today" })}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard"><QrCode />{t({ es: "Ver mi pase", en: "View my pass" })}</Link>
              </Button>
            </div>
          </div>

          {/* Hero photo with floating live nearest-unit card */}
          <div className="relative">
            <figure className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-violet-900/20">
              <img
                src="/hero-parada.webp"
                alt={t({
                  es: "Una enfermera de PARADA atiende a un cocinero y a un operario junto a la unidad móvil en una calle de Madrid",
                  en: "A PARADA nurse greets a chef and a site worker beside the mobile unit on a Madrid street",
                })}
                width={1600}
                height={1104}
                fetchPriority="high"
                className="aspect-[4/3] w-full object-cover object-[55%_center] lg:aspect-[4/5]"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <figcaption className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink shadow backdrop-blur">
                <Timer className="size-4 text-pink-600" />
                {t({ es: "Sin cita · menos de 20 min", en: "Walk-in · under 20 min" })}
              </figcaption>
            </figure>

            <Card className="relative mx-4 -mt-20 overflow-hidden border-0 bg-ink p-0 text-white shadow-2xl shadow-violet-900/40 sm:mx-8 lg:absolute lg:-bottom-8 lg:-left-12 lg:mx-0 lg:mt-0 lg:w-[22rem]">
              <div className="h-1.5 bg-brand" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-pink-300">
                    {st.kind === "open" ? t({ es: "Abierta ahora", en: "Open now" }) : t({ es: "Próxima unidad", en: "Next unit" })}
                  </p>
                  <div className="flex gap-1">{nearest.lines.map((l) => <LineBadge key={l} id={l} size="sm" />)}</div>
                </div>
                <h2 className="mt-1 text-2xl font-black">{nearest.name}</h2>
                <p className="text-sm text-slate-300">{t(nearest.address)}</p>
                <OpenPill slots={nearest.slots} className="mt-3 bg-white/10 text-white" />
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="flex items-center gap-1.5"><Clock className="size-4 text-orange-300" /><b>{wLo}–{wHi} min</b> <span className="text-slate-300">{t({ es: "espera", en: "wait" })}</span></span>
                  <span className="flex items-center gap-1.5"><FlaskConical className="size-4 text-pink-300" /><b>{nearest.tests.length}</b> <span className="text-slate-300">{t({ es: "pruebas", en: "tests" })}</span></span>
                </div>
                <Button asChild variant="brand" className="mt-4 w-full">
                  <Link to={`/locator?stop=${nearest.id}`}>{t({ es: "Ver detalles y generar pase", en: "View details & get a pass" })}<ArrowRight /></Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Timer, big: t({ es: "20 min", en: "20 min" }), small: t({ es: "de media por visita", en: "average per visit" }) },
            { icon: Briefcase, big: "0", small: t({ es: "horas de trabajo perdidas", en: "work hours lost" }) },
            { icon: FlaskConical, big: String(ALL_TESTS.length), small: t({ es: "pruebas rápidas disponibles", en: "rapid tests available" }) },
          ].map((m) => (
            <div key={m.small} className="flex items-center gap-4 rounded-3xl bg-mist p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white"><m.icon className="size-6" /></span>
              <div>
                <p className="text-3xl font-black leading-none">{m.big}</p>
                <p className="text-sm font-semibold text-slate-600">{m.small}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-pink-600">{t({ es: "Cómo funciona", en: "How it works" })}</p>
        <h2 className="mt-1 text-3xl font-black">{t({ es: "4 pasos. Ni una hora perdida.", en: "4 steps. Not one hour lost." })}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={i} className="relative rounded-3xl border border-slate-200 p-5">
              <span className="absolute right-5 top-4 text-5xl font-black text-slate-100">{i + 1}</span>
              <span className="relative grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><s.icon className="size-6" /></span>
              <h3 className="relative mt-4 text-lg font-extrabold">{t(s.title)}</h3>
              <p className="relative mt-1 text-sm text-slate-600">{t(s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* RETO TEASER */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand p-6 text-white sm:p-10">
          <div aria-hidden className="absolute -right-10 -top-10 text-[10rem] leading-none opacity-20">⚡</div>
          <Badge className="bg-white/20 text-white">{t({ es: "Nuevo", en: "New" })}</Badge>
          <h2 className="mt-3 max-w-xl text-3xl font-black">{t({ es: "Reto Parada 60s: el minuto de salud de tu descanso", en: "Parada 60s Challenge: the health minute for your break" })}</h2>
          <p className="mt-2 max-w-xl text-white/90">
            {t({
              es: "Mitos y verdades en tarjetas rápidas, rachas, insignias y un Pase Prioritario para saltarte la cola.",
              en: "Myths and facts in quick cards, streaks, badges and a Priority Pass to skip the queue.",
            })}
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6">
            <Link to="/reto"><Sparkles />{t({ es: "Jugar ahora (1 min)", en: "Play now (1 min)" })}</Link>
          </Button>
        </div>
      </section>

      {/* NETWORK + FAQ */}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black">{t({ es: "La red del piloto", en: "The pilot network" })}</h2>
          <ul className="mt-4 divide-y divide-slate-200 rounded-3xl border border-slate-200">
            {STOPS.map((s) => (
              <li key={s.id}>
                <Link to={`/locator?stop=${s.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-mist">
                  <Train className="size-4 shrink-0 text-slate-400" />
                  <span className="font-bold">{s.name}</span>
                  <span className="ml-auto"><OpenPill slots={s.slots} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-black">{t({ es: "Preguntas frecuentes", en: "FAQ" })}</h2>
          <Accordion type="single" collapsible className="mt-4 rounded-3xl border border-slate-200 px-5">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`}>
                <AccordionTrigger>{t(f.q)}</AccordionTrigger>
                <AccordionContent>{t(f.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
