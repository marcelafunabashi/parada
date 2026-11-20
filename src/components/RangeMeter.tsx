import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLang } from "@/i18n";
import type { Level, RangeDef } from "@/data/ranges";
import { classify } from "@/data/ranges";
import { cn } from "@/lib/utils";

const ZONE = { normal: "bg-emerald-400", warning: "bg-amber-400", elevated: "bg-rose-500" };

/** Horizontal meter with normal / warning / elevated zones and a marker for the value. */
export function RangeMeter({ def, value }: { def: RangeDef; value: number }) {
  const { t } = useLang();
  const span = def.max - def.min;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - def.min) / span) * 100));
  const level = classify(def, value);

  // Build zones left→right
  let zones: { from: number; to: number; level: Level }[];
  if (def.inverted) {
    zones = [
      { from: def.min, to: def.elevatedFrom, level: "elevated" },
      { from: def.elevatedFrom, to: def.warnFrom, level: "warning" },
      { from: def.warnFrom, to: def.max, level: "normal" },
    ];
  } else {
    zones = [
      ...(def.lowWarn !== undefined ? [{ from: def.min, to: def.lowWarn, level: "warning" as Level }] : []),
      { from: def.lowWarn ?? def.min, to: def.warnFrom, level: "normal" },
      { from: def.warnFrom, to: def.elevatedFrom, level: "warning" },
      { from: def.elevatedFrom, to: def.max, level: "elevated" },
    ];
  }

  return (
    <div className="pt-7">
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          {zones.map((z, i) => (
            <div key={i} className={cn(ZONE[z.level], "h-full")} style={{ width: `${pct(z.to) - pct(z.from)}%` }} />
          ))}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="absolute -top-7 -translate-x-1/2 focus-visible:outline-offset-4"
              style={{ left: `${pct(value)}%` }}
              aria-label={`${t(def.label)}: ${value} ${def.unit}`}
            >
              <span className={cn("block rounded-md px-1.5 py-0.5 text-[11px] font-black text-white", level === "normal" ? "bg-emerald-600" : level === "warning" ? "bg-amber-600" : "bg-rose-600")}>
                {value}
              </span>
              <span className="mx-auto mt-0.5 block h-4 w-1 rounded-full bg-ink" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t(def.normalText)}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
        <span>{def.min}</span>
        <span>{def.max}</span>
      </div>
    </div>
  );
}
