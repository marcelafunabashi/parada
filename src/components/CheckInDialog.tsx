import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Clock, Coffee, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n";
import { useStore } from "@/store";
import { TESTS, totalMinutes, type TestId } from "@/data/tests";
import type { Stop } from "@/data/stops";
import { cn } from "@/lib/utils";
import { burst, sfx } from "@/lib/fx";

export function CheckInDialog({ stop, open, onOpenChange }: { stop: Stop | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const createPass = useStore((s) => s.createPass);
  const existing = useStore((s) => s.pass);
  const [sel, setSel] = useState<TestId[]>([]);

  useEffect(() => {
    if (!stop || !open) return;
    // Pre-select what the worker had already chosen (e.g. a recommended pack), restricted to this unit.
    const fromPass = existing?.status !== "done" ? existing?.tests.filter((x) => stop.tests.includes(x)) : undefined;
    setSel(fromPass?.length ? fromPass : stop.tests.filter((x) => ["bp", "glucose", "bmi"].includes(x)));
  }, [stop, open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stop) return null;
  const toggle = (id: TestId) => { sfx("tap"); setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); };
  const fasting = sel.some((id) => TESTS[id].fasting);
  const replacing = existing && existing.status !== "done";

  const generate = () => {
    createPass({ stopId: stop.id, tests: sel, pack: existing?.status !== "done" ? existing?.pack : undefined });
    sfx("level");
    burst();
    onOpenChange(false);
    navigate("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t({ es: "Cerrar", en: "Close" })}>
        <DialogHeader>
          <DialogTitle>{t({ es: "Pase rápido", en: "Fast pass" })} · {stop.name}</DialogTitle>
          <DialogDescription>
            {t({
              es: "Elige tus pruebas. Sin cita: enseña el pase al llegar y te atendemos por orden.",
              en: "Pick your tests. No appointment: show the pass on arrival and we'll see you in order.",
            })}
          </DialogDescription>
        </DialogHeader>

        <fieldset>
          <legend className="sr-only">{t({ es: "Pruebas", en: "Tests" })}</legend>
          <div className="grid grid-cols-2 gap-2">
            {stop.tests.map((id) => {
              const on = sel.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-semibold transition-all",
                    on ? "border-violet-600 bg-violet-50 text-violet-900" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-lg border-2", on ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300")}>
                    {on && <Check className="size-4" />}
                  </span>
                  <span className="leading-tight">
                    {t(TESTS[id].short)}
                    <span className="block text-xs font-medium text-slate-500">{TESTS[id].minutes} min{TESTS[id].fasting ? ` · ${t({ es: "ayuno", en: "fasting" })}` : ""}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-mist p-3 text-sm">
          <span className="inline-flex items-center gap-1.5 font-bold"><Clock className="size-4 text-violet-600" />~{totalMinutes(sel)} min {t({ es: "en total", en: "total" })}</span>
          {fasting && (
            <span className="inline-flex items-center gap-1.5 text-amber-800"><Coffee className="size-4" />{t({ es: "Mejor en ayunas (agua sí)", en: "Best fasting (water OK)" })}</span>
          )}
        </div>
        {replacing && (
          <p className="mt-3 text-xs text-slate-500">
            {t({ es: `Sustituirá tu pase actual (${existing.code}).`, en: `This replaces your current pass (${existing.code}).` })}
          </p>
        )}

        <Button className="mt-5 w-full" size="lg" disabled={!sel.length} onClick={generate}>
          <QrCode /> {t({ es: "Generar mi pase", en: "Generate my pass" })}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
