# PARADA — Tu chequeo, a la vuelta del trabajo

Bilingual (ES/EN) preventive-health demo for the Madrid pilot: walk-in mobile units at transit and work hubs for shift workers.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Routes
| Route | What |
|---|---|
| `/` | Landing: live nearest unit, 4-step process, pilot metrics, FAQ |
| `/locator` | 9 Madrid stops, day/test/fasting filters, open-now sorting, schematic map, fast-pass dialog |
| `/dashboard` | Digital pass (QR + 6-char code), queue status, time-saved tracker, history / follow-ups / vaccines / uploads |
| `/results` | Range meters, doctor's plain-language summary, Q&A thread |
| `/pro` | Clinician queue, search, rapid result entry, document review, inbox, demo reset |
| `/reto` | Reto Parada 60s: swipe quiz, Health Readiness Meter → pack, streaks, tiers, badges |

## Notes
- All schedule math runs in `Europe/Madrid` (`src/lib/time.ts`), independent of the device clock.
- Every string is a `{ es, en }` pair; switch with the header toggle.
- State lives in a Zustand store (`src/store`) persisted to `localStorage` and synced across tabs —
  open `/dashboard` and `/pro` side by side to see check-ins, results, documents and messages sync live.
- All medical data is simulated. Not a medical device.
