import confetti from "canvas-confetti";
import { useStore } from "@/store";

const BRAND = ["#7c3aed", "#ec4899", "#f97316", "#facc15", "#ffffff"];

export function burst(origin?: { x: number; y: number }) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti({ particleCount: 90, spread: 75, startVelocity: 38, origin: origin ?? { y: 0.6 }, colors: BRAND, scalar: 0.9 });
}

export function bigBurst() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const end = Date.now() + 700;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 }, colors: BRAND });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 }, colors: BRAND });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

let ctx: AudioContext | null = null;
function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.02);
}

export function sfx(kind: "correct" | "wrong" | "tap" | "level") {
  if (!useStore.getState().sound) return;
  try {
    if (kind === "correct") { tone(660, 0, 0.12); tone(990, 0.09, 0.2); }
    else if (kind === "wrong") { tone(220, 0, 0.18, "triangle"); tone(180, 0.12, 0.22, "triangle"); }
    else if (kind === "tap") tone(520, 0, 0.05, "sine", 0.06);
    else { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25)); }
  } catch { /* audio not available */ }
}
