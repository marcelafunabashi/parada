import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Coffee, LocateFixed, MapPin, QrCode, Users, Wrench, X, CalendarDays, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LineBadge, LiveDot, OpenPill, SectionTitle, useTick } from "@/components/brand";
import { CheckInDialog } from "@/components/CheckInDialog";
import { useLang, WEEKDAYS } from "@/i18n";
import { STOPS, waitRange, type Stop } from "@/data/stops";
import { ALL_TESTS, TESTS, type TestId } from "@/data/tests";
import { madridNow, openSortKey, openState, toMin, type Weekday } from "@/lib/time";
import { cn } from "@/lib/utils";
import { StopsMap } from "@/components/StopsMap";

type FastMode = "all" | "nofast" | "fast";

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function useIsDesktop() {
  const [d, setD] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return d;
}

/* ---------- map links ---------- */
/** OpenStreetMap export embed centred on the stop, with a marker at its exact coordinates. */
function osmEmbedUrl(stop: Stop, d = 0.012) {
  const bbox = [stop.lng - d, stop.lat - d * 0.6, stop.lng + d, stop.lat + d * 0.6].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${stop.lat},${stop.lng}`;
}
/** Deep link that opens Google Maps (app or web) with directions to the stop. */
const directionsUrl = (stop: Stop) => `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;

/* ---------- detail panel ---------- */
function StopDetail({ stop, day, onCheckIn, onClose }: { stop: Stop; day: Weekday; onCheckIn: () => void; onClose?: () => void }) {
  const { t } = useLang();
  const now = madridNow();
  const st = openState(stop.slots, now);
  const [lo, hi] = waitRange(stop);
  const weekSlots = ([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map((d) => ({ d, slots: stop.slots.filter((s) => s.day === d) }));
  return (
    <div className="animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex gap-1">{stop.lines.map((l) => <LineBadge key={l} id={l} />)}</div>
          <h2 className="text-2xl font-black leading-tight">{stop.name}</h2>
          <p className="text-sm text-slate-600">{stop.district}</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label={t({ es: "Cerrar", en: "Close" })} className="grid size-11 place-items-center rounded-full hover:bg-slate-100"><X className="size-5" /></button>
        )}
      </div>
      <OpenPill slots={stop.slots} className="mt-3" />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-mist p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><Clock className="size-3.5" />{t({ es: "Espera", en: "Wait" })}</p>
          <p className="mt-1 text-lg font-black">{st.kind === "open" ? t({ es: `${lo}-${hi} min de espera`, en: `${lo}-${hi} min wait` }) : "—"}</p>
        </div>
        <div className="rounded-2xl bg-mist p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><Users className="size-3.5" />{t({ es: "Pensada para", en: "Built for" })}</p>
          <p className="mt-1 text-sm font-bold leading-tight">{t(stop.audience)}</p>
        </div>
      </div>

      {/* OpenStreetMap embed: no SDK, token or API key needed */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <iframe
          key={stop.id}
          title={t({ es: `Mapa de la parada ${stop.name}`, en: `Map of the ${stop.name} stop` })}
          src={osmEmbedUrl(stop)}
          className="h-56 w-full border-0 lg:h-64"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col gap-3 bg-mist p-3 sm:flex-row sm:items-center">
          <p className="flex flex-1 gap-2 text-sm"><MapPin className="mt-0.5 size-4 shrink-0 text-pink-600" /><span><b>{t(stop.address)}</b><br />{t(stop.spot)}</span></p>
          <Button asChild size="sm" variant="dark" className="shrink-0">
            <a href={directionsUrl(stop)} target="_blank" rel="noreferrer"><Navigation />{t({ es: "Cómo llegar", en: "Directions" })}</a>
          </Button>
        </div>
      </div>

      <h3 className="mt-5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-500"><CalendarDays className="size-4" />{t({ es: "Horario semanal", en: "Weekly schedule" })}</h3>
      <ul className="mt-2 grid gap-1 text-sm">
        {weekSlots.filter((w) => w.d <= 5 || w.slots.length).map((w) => (
          <li key={w.d} className={cn("flex items-center justify-between rounded-xl px-3 py-2", w.d === day ? "bg-violet-50 font-bold text-violet-900" : "bg-white")}>
            <span className="capitalize">{t(WEEKDAYS[w.d].long)}{w.d === now.weekday && <span className="ml-1 text-xs text-pink-600">· {t({ es: "hoy", en: "today" })}</span>}</span>
            <span>{w.slots.length ? w.slots.map((s) => `${s.open}–${s.close}`).join(" · ") : <span className="text-slate-400">{t({ es: "Sin servicio", en: "No service" })}</span>}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-sm font-extrabold uppercase tracking-wide text-slate-500">{t({ es: "Pruebas a bordo", en: "Tests on board" })}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {stop.tests.map((id) => (
          <Badge key={id} variant={TESTS[id].fasting ? "warning" : "violet"}>
            {TESTS[id].fasting && <Coffee />}{t(TESTS[id].short)} · {TESTS[id].minutes}′
          </Badge>
        ))}
      </div>

      <h3 className="mt-5 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-500"><Wrench className="size-4" />{t({ es: "Equipamiento", en: "Equipment" })}</h3>
      <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
        {stop.equipment.map((e, i) => <li key={i}>{t(e)}</li>)}
      </ul>

      <Button size="lg" className="mt-6 w-full" onClick={onCheckIn}><QrCode />{t({ es: "Generar Pase Rápido / Check-in", en: "Get Fast Pass / Check-in" })}</Button>
    </div>
  );
}

/* ---------- page ---------- */
export default function Locator() {
  const { t } = useLang();
  useTick(30000);
  const isDesktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const now = madridNow();
  const today = now.weekday;
  const [day, setDay] = useState<Weekday>(today <= 5 ? today : 1);
  const [testsSel, setTestsSel] = useState<TestId[]>([]);
  const [fast, setFast] = useState<FastMode>("all");
  const [selected, setSelected] = useState<string | null>(params.get("stop"));
  const [checkInStop, setCheckInStop] = useState<Stop | null>(null);
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  useEffect(() => {
    const p = params.get("stop");
    if (p) setSelected(p);
  }, [params]);

  const select = (id: string | null) => {
    setSelected(id);
    if (id) setParams({ stop: id }, { replace: true }); else setParams({}, { replace: true });
  };

  const isToday = day === today;

  const list = useMemo(() => {
    let l = STOPS.filter((s) => s.slots.some((sl) => sl.day === day));
    if (testsSel.length) l = l.filter((s) => testsSel.every((x) => s.tests.includes(x)));
    if (fast === "fast") l = l.filter((s) => s.tests.some((x) => TESTS[x].fasting) && s.slots.some((sl) => sl.day === day && toMin(sl.open) <= toMin("10:00")));
    return l
      .map((s) => ({ s, st: openState(s.slots, now), dist: me ? distanceKm(me, s) : null }))
      .sort((a, b) => {
        if (isToday) {
          const k = openSortKey(a.st) - openSortKey(b.st);
          if (k !== 0) return k;
        } else {
          const fa = Math.min(...a.s.slots.filter((x) => x.day === day).map((x) => toMin(x.open)));
          const fb = Math.min(...b.s.slots.filter((x) => x.day === day).map((x) => toMin(x.open)));
          if (fa !== fb) return fa - fb;
        }
        return (a.dist ?? 0) - (b.dist ?? 0);
      });
  }, [day, testsSel, fast, now.minutes, me, isToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const selStop = STOPS.find((s) => s.id === selected) ?? null;
  const visibleTests = ALL_TESTS.filter((id) => (fast === "nofast" ? !TESTS[id].fasting : fast === "fast" ? TESTS[id].fasting : true));

  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg(t({ es: "Tu navegador no permite ubicación.", en: "Your browser doesn't support location." }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (distanceKm(p, { lat: 40.4168, lng: -3.7038 }) > 60) {
          setGeoMsg(t({ es: "Parece que no estás en Madrid: ordenamos por horario.", en: "Looks like you're not in Madrid: sorting by schedule." }));
          setMe(null);
        } else { setMe(p); setGeoMsg(null); }
      },
      () => setGeoMsg(t({ es: "No pudimos obtener tu ubicación.", en: "We couldn't get your location." })),
      { timeout: 8000 },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <SectionTitle
        eyebrow={t({ es: "Red de Madrid", en: "Madrid network" })}
        title={t({ es: "Encuentra tu parada", en: "Find your stop" })}
        sub={t({ es: "Horarios en hora de Madrid. Las abiertas ahora aparecen primero.", en: "Times in Madrid time. Units open now appear first." })}
      />

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t({ es: "Día", en: "Day" })}>
          {([1, 2, 3, 4, 5] as Weekday[]).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              aria-pressed={day === d}
              className={cn(
                "flex min-h-11 min-w-14 shrink-0 flex-col items-center justify-center rounded-2xl border-2 px-3 text-sm font-extrabold transition-all",
                day === d ? "border-ink bg-ink text-white" : "border-slate-200 hover:border-slate-300",
              )}
            >
              {t(WEEKDAYS[d].short)}
              {d === today && <span className={cn("text-[10px] font-bold", day === d ? "text-pink-300" : "text-pink-600")}>{t({ es: "hoy", en: "today" })}</span>}
            </button>
          ))}
          <div className="mx-1 w-px shrink-0 bg-slate-200" />
          {([
            ["all", { es: "Todas", en: "All" }],
            ["nofast", { es: "Sin ayuno", en: "No fasting" }],
            ["fast", { es: "En ayunas (mañana)", en: "Fasting (morning)" }],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => { setFast(k); setTestsSel((s) => s.filter((x) => (k === "nofast" ? !TESTS[x].fasting : k === "fast" ? TESTS[x].fasting : true))); }}
              aria-pressed={fast === k}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3 text-sm font-bold",
                fast === k ? "border-violet-600 bg-violet-50 text-violet-900" : "border-slate-200",
              )}
            >
              {k === "fast" && <Coffee className="size-4" />}{t(l)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t({ es: "Prueba", en: "Test" })}>
          {visibleTests.map((id) => {
            const on = testsSel.includes(id);
            return (
              <button
                key={id}
                aria-pressed={on}
                onClick={() => setTestsSel((s) => (on ? s.filter((x) => x !== id) : [...s, id]))}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border-2 px-4 text-sm font-semibold transition-all",
                  on ? "border-pink-500 bg-pink-50 text-pink-800" : "border-slate-200 text-slate-700 hover:border-slate-300",
                )}
              >
                {t(TESTS[id].short)}
              </button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={locate} className="shrink-0"><LocateFixed />{t({ es: "Cerca de mí", en: "Near me" })}</Button>
        </div>
        {geoMsg && <p className="text-sm text-amber-700">{geoMsg}</p>}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* list + map */}
        <div className="space-y-4">
          <Card className="relative h-72 overflow-hidden p-0 sm:h-96">
            <StopsMap stops={list.map((x) => x.s)} selected={selected} onSelect={(id) => select(id)} me={me} />
          </Card>
          <p className="text-sm font-semibold text-slate-600" aria-live="polite">
            {t({ es: `${list.length} paradas el ${WEEKDAYS[day].long.es}`, en: `${list.length} stops on ${WEEKDAYS[day].long.en}` })}
          </p>
          <ul className="space-y-2">
            {list.map(({ s, st, dist }) => {
              const open = isToday && st.kind === "open";
              const [lo, hi] = waitRange(s);
              const daySlots = s.slots.filter((x) => x.day === day);
              return (
                <li key={s.id}>
                  <button
                    onClick={() => select(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-3xl border-2 p-4 text-left transition-all hover:border-slate-300",
                      selected === s.id ? "border-pink-500 bg-pink-50/40" : "border-slate-200",
                      open && selected !== s.id && "border-emerald-200 bg-emerald-50/40",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isToday && <LiveDot on={open} />}
                        <span className="truncate text-lg font-extrabold">{s.name}</span>
                        {dist !== null && <span className="text-xs font-semibold text-slate-500">{dist.toFixed(1)} km</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {s.lines.map((l) => <LineBadge key={l} id={l} size="sm" />)}
                        <span className="ml-1 text-xs text-slate-500">{daySlots.map((x) => `${x.open}–${x.close}`).join(" · ")}</span>
                      </div>
                      {isToday ? (
                        <OpenPill slots={s.slots} className="mt-2" />
                      ) : (
                        <p className="mt-2 text-xs font-bold text-slate-600">{t({ es: `Abre el ${WEEKDAYS[day].long.es} a las ${daySlots[0]?.open}`, en: `Opens ${WEEKDAYS[day].long.en} at ${daySlots[0]?.open}` })}</p>
                      )}
                    </div>
                    {open && (
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-emerald-700">{lo}-{hi}′</p>
                        <p className="text-[11px] font-semibold text-slate-500">{t({ es: "espera", en: "wait" })}</p>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
            {!list.length && (
              <li className="rounded-3xl bg-mist p-6 text-center text-slate-600">
                {t({ es: "Ninguna parada cumple estos filtros. Prueba otro día o quita alguna prueba.", en: "No stop matches these filters. Try another day or remove a test." })}
              </li>
            )}
          </ul>
        </div>

        {/* detail */}
        {isDesktop ? (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="p-6">
              {selStop ? (
                <StopDetail stop={selStop} day={day} onCheckIn={() => setCheckInStop(selStop)} onClose={() => select(null)} />
              ) : (
                <div className="grid min-h-80 place-items-center text-center text-slate-500">
                  <div>
                    <MapPin className="mx-auto size-10 text-pink-400" />
                    <p className="mt-2 font-semibold">{t({ es: "Elige una parada para ver detalles", en: "Pick a stop to see details" })}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Dialog open={!!selStop && !checkInStop} onOpenChange={(o) => !o && select(null)}>
            <DialogContent closeLabel={t({ es: "Cerrar", en: "Close" })}>
              <DialogTitle className="sr-only">{selStop?.name}</DialogTitle>
              {selStop && <StopDetail stop={selStop} day={day} onCheckIn={() => setCheckInStop(selStop)} />}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <CheckInDialog stop={checkInStop} open={!!checkInStop} onOpenChange={(o) => !o && setCheckInStop(null)} />
    </div>
  );
}
