# Surge

**A Somatic Circuit Breaker.**

Surge provides immediate, non-destructive nervous system regulation at the
peak of a crisis — bridging the gap between chaos and baseline. It is the
emergency brake of the Purpose Driven Collection: where _Drift_ and _Marrow_
are for maintenance, Surge is for the acute strike.

It is a piece of high-end, slow-tech utility disguised as software:

- **Zero-friction entry.** No splash screen, no loading screen, no login. The
  "Press and hold" trigger is active within milliseconds.
- **The dead-man's switch.** The intervention requires the user to hold their
  thumb on the screen. Releasing pauses the system and it gently pulses,
  waiting for them to return — forcing physical anchoring.
- **The 90-second curve.** A single normalized curve drives every sensory
  channel from the chaotic peak down to baseline (`0.0`).
- **Seamless handoff.** When the curve hits `0.0`, the screen fades and routes
  to **Heron** recovery (if unlocked via Clinical Token) or a minimalist
  token entry prompt.

The reward is the physical relief. There are no streaks, badges, or
congratulations.

## The Somatic Signature

| Channel    | Peak (chaos)                                  | Baseline (calm)                                    |
| ---------- | --------------------------------------------- | -------------------------------------------------- |
| **Visual** | Stark white/amber core, restrained strobe     | Slow radial blur expanding/contracting at 60 BPM   |
| **Audio**  | Dense, overwhelming white noise (the roar)     | A deep, warm sub-bass pulse at 60 BPM              |
| **Haptic** | Sharp, chaotic static                          | Heavy, resonant 60 BPM heartbeat thuds             |

The visual strobe is intentionally capped at ≤ 2.5 Hz with low amplitude and is
disabled under `prefers-reduced-motion`, to avoid triggering photosensitivity.

---

## Web MVP — React (`web/`)

Production deploy target (Netlify). Supabase-backed Clinical Token auth,
Tailwind CSS, Framer Motion, procedural Web Audio synthesis.

```
web/
├── src/
│   ├── hooks/
│   │   ├── useTokenManager.js      # B2B clinical token auth (localStorage + Supabase)
│   │   └── useSurgeEngine.js       # Procedural Web Audio somatic state machine
│   ├── components/
│   │   └── SurgeInterface.jsx      # Dead-man's switch UI
│   └── lib/
│       └── supabaseClient.js
├── netlify.toml
└── package.json
```

### Quick Start

```bash
cd web
npm install
cp .env.example .env.local   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

### Components

**`useTokenManager`** — Exposes `token`, `isHeronUnlocked`, `isLoading`, `error`.
Validates via `@supabase/supabase-js` against `clinical_tokens` (Edge Function
fallback). Network failures preserve cached unlock state.

**`useSurgeEngine`** — 90-second decay curve with pink noise + 55 Hz sub-bass
heartbeat. `navigator.vibrate` on Android (silent on iOS).

**`SurgeInterface`** — Full-screen dead-man's switch, intensity-bound visuals,
Heron handoff or token entry on completion.

---

## Web Reference — TypeScript (`src/`)

Canvas 2D + class-based Web Audio engine. Offline-first, no backend.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npm run typecheck
```

Append `?d=<seconds>` to shorten the 90 s curve during testing
(e.g. `http://localhost:5173/?d=12`).

---

## iOS — Swift/SwiftUI (`Surge/`)

Native app with `CHHapticEngine`, `AVFoundation`, and `TokenManager`.

```
Surge/
├── Core/
│   ├── Authentication/TokenManager.swift
│   └── Engine/SurgeEngine.swift
├── Features/Surge/Views/SurgeView.swift
└── App/SurgeApp.swift
```

Requires iOS 17+, Xcode 15+. Add `chaosNoise.mp3` and `heartbeat.mp3` to the
bundle before shipping.

---

## Unity (`unity/`)

`ClinicalTokenManager.cs` and `HeronBridge.cs` — B2B Clinical Token model with
Supabase verification for the Unity runtime.

---

## Deployment

Netlify (`netlify.toml` at repo root) builds from `web/`:

```bash
cd web && npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify dashboard.

### Supabase Schema

```sql
create table clinical_tokens (
  token text primary key,
  active boolean default true
);
```

## Privacy

- No accounts, no PII
- Clinical tokens are anonymous 6-character codes
- Token validation is optional background I/O
- Somatic output runs fully offline once loaded

## License

Proprietary — Surge Health
