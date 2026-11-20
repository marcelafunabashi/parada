import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, MapPin, QrCode, Sparkles, FileHeart, Stethoscope, Volume2, VolumeX } from "lucide-react";
import { Logo } from "./brand";
import { useLang, type L } from "@/i18n";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { madridClock } from "@/lib/time";
import { useTick } from "./brand";

const NAV: { to: string; label: L; icon: typeof Home }[] = [
  { to: "/", label: { es: "Inicio", en: "Home" }, icon: Home },
  { to: "/locator", label: { es: "Paradas", en: "Stops" }, icon: MapPin },
  { to: "/dashboard", label: { es: "Mi pase", en: "My pass" }, icon: QrCode },
  { to: "/reto", label: { es: "Reto 60s", en: "60s Quiz" }, icon: Sparkles },
  { to: "/results", label: { es: "Resultados", en: "Results" }, icon: FileHeart },
];

function LangSwitch() {
  const { lang } = useLang();
  const setLang = useStore((s) => s.setLang);
  return (
    <div role="group" aria-label="Idioma / Language" className="flex rounded-full bg-slate-100 p-1">
      {(["es", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "grid h-9 min-w-11 place-items-center rounded-full px-2 text-sm font-extrabold uppercase transition-all",
            lang === l ? "bg-ink text-white shadow" : "text-slate-600 hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const { t, lang } = useLang();
  const { pathname } = useLocation();
  const pass = useStore((s) => s.pass);
  const sound = useStore((s) => s.sound);
  const toggleSound = useStore((s) => s.toggleSound);
  useTick(30000);

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const isPro = pathname.startsWith("/pro");

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-ink focus:p-3 focus:text-white">
        {t({ es: "Saltar al contenido", en: "Skip to content" })}
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" aria-label="PARADA" className="shrink-0"><Logo /></Link>
          {isPro && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">PRO</span>}
          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label={t({ es: "Principal", en: "Main" })}>
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn("flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink",
                    isActive && "bg-violet-50 text-violet-800")
                }
              >
                <n.icon className="size-4" />
                {t(n.label)}
                {n.to === "/dashboard" && pass && pass.status !== "done" && <span className="size-2 rounded-full bg-pink-500" />}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden whitespace-nowrap text-xs font-semibold text-slate-500 sm:block lg:hidden xl:block" title="Europe/Madrid">
              Madrid · {madridClock(new Date(), lang)}
            </span>
            <button
              onClick={toggleSound}
              aria-pressed={sound}
              aria-label={sound ? t({ es: "Silenciar sonidos", en: "Mute sounds" }) : t({ es: "Activar sonidos", en: "Turn sounds on" })}
              className="grid size-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100"
            >
              {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </button>
            <Link
              to="/pro"
              className={cn(
                "hidden min-h-11 items-center gap-2 rounded-xl border-2 border-slate-200 px-3 text-sm font-bold hover:bg-mist sm:flex",
                isPro && "border-ink bg-ink text-white hover:bg-slate-800",
              )}
            >
              <Stethoscope className="size-4" />
              <span className="lg:hidden xl:inline">{t({ es: "Profesionales", en: "Clinicians" })}</span>
            </Link>
            <LangSwitch />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 pb-28 lg:pb-12">
        <Outlet />
      </main>

      <footer className="hidden border-t border-slate-200 bg-mist lg:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-slate-600">
          <p>
            {t({
              es: "PARADA · Piloto Madrid. Demo: los datos son simulados y no sustituyen a tu médico de cabecera. Urgencias: 112.",
              en: "PARADA · Madrid pilot. Demo: data is simulated and does not replace your GP. Emergencies: 112.",
            })}
          </p>
          <Link to="/pro" className="font-semibold text-violet-700 underline-offset-4 hover:underline">
            {t({ es: "Espacio profesional", en: "Clinician workspace" })}
          </Link>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={t({ es: "Navegación", en: "Navigation" })}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn("relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-slate-500",
                  isActive && "text-violet-700")
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-all", isActive && "bg-violet-100")}>
                    <n.icon className="size-5" />
                  </span>
                  {t(n.label)}
                  {n.to === "/dashboard" && pass && pass.status !== "done" && (
                    <span className="absolute right-[30%] top-2 size-2.5 rounded-full bg-pink-500 ring-2 ring-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
