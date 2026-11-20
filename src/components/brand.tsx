import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LINES, type LineId } from "@/data/stops";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLang, WEEKDAYS } from "@/i18n";
import { openState, madridNow, type OpenState, type Slot } from "@/lib/time";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-black tracking-tight", className)}>
      <svg viewBox="0 0 64 64" className="size-9" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c3aed" /><stop offset=".5" stopColor="#ec4899" /><stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#lg)" />
        <path d="M20 46V18h14a10 10 0 0 1 0 20h-6v8z" fill="#fff" />
        <circle cx="34" cy="28" r="4" fill="#ec4899" />
      </svg>
      <span className="text-xl">PARADA</span>
    </span>
  );
}

export function LineBadge({ id, size = "md" }: { id: LineId; size?: "sm" | "md" }) {
  const { t } = useLang();
  const l = LINES[id];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={t(l.name)}
          className={cn(
            "inline-grid place-items-center rounded-full font-black leading-none ring-2 ring-white",
            size === "sm" ? "h-6 min-w-6 px-1 text-[11px]" : "h-7 min-w-7 px-1.5 text-xs",
            id === "BUS" && "rounded-md",
          )}
          style={{ background: l.bg, color: l.fg }}
        >
          {l.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{t(l.name)}</TooltipContent>
    </Tooltip>
  );
}

export function useOpenLabel() {
  const { t } = useLang();
  return (st: OpenState) => {
    switch (st.kind) {
      case "open": {
        const left = st.minutesLeft;
        return left <= 60
          ? t({ es: `Abierta · cierra en ${left} min`, en: `Open · closes in ${left} min` })
          : t({ es: `Abierta hasta las ${st.closesAt}`, en: `Open until ${st.closesAt}` });
      }
      case "later-today":
        return st.minutesUntil <= 60
          ? t({ es: `Abre en ${st.minutesUntil} min (${st.opensAt})`, en: `Opens in ${st.minutesUntil} min (${st.opensAt})` })
          : t({ es: `Abre hoy a las ${st.opensAt}`, en: `Opens today at ${st.opensAt}` });
      case "future":
        if (st.daysAhead === 1) return t({ es: `Abre mañana a las ${st.opensAt}`, en: `Opens tomorrow at ${st.opensAt}` });
        return t({ es: `Abre el ${WEEKDAYS[st.day].long.es} a las ${st.opensAt}`, en: `Opens ${WEEKDAYS[st.day].long.en} at ${st.opensAt}` });
      default:
        return t({ es: "Sin horario", en: "No schedule" });
    }
  };
}

export function OpenPill({ slots, className }: { slots: Slot[]; className?: string }) {
  const label = useOpenLabel();
  const st = openState(slots, madridNow());
  const open = st.kind === "open";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold",
        open ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700",
        className,
      )}
    >
      <LiveDot on={open} />
      {label(st)}
    </span>
  );
}

export function LiveDot({ on }: { on: boolean }) {
  return (
    <span className="relative inline-flex size-2.5">
      {on && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse-ring" />}
      <span className={cn("relative inline-flex size-2.5 rounded-full", on ? "bg-emerald-500" : "bg-slate-400")} />
    </span>
  );
}

export function SectionTitle({ eyebrow, title, sub, className }: { eyebrow?: string; title: string; sub?: string; className?: string }) {
  return (
    <div className={cn("mb-5", className)}>
      {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-widest text-pink-600">{eyebrow}</p>}
      <h1 className="text-2xl font-black leading-tight sm:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-slate-600">{sub}</p>}
    </div>
  );
}

/** Re-render every `ms` so live clocks/countdowns stay fresh. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}
