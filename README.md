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
- **Seamless handoff.** When the curve hits `0.0`, the heartbeat pulses three
  final times, the screen fades to a softer gray, and a single button appears:
  **Begin Recovery (Heron)**.

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

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- Web Audio API (sonic brand), Vibration API (haptic brand), Canvas 2D (visual)
- No backend, no network calls, no accounts — it works offline once loaded.

## Development

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run lint     # ESLint
npm run typecheck# TypeScript, no emit
npm run build    # typecheck + production build to dist/
npm run preview  # serve the production build
```

### Shortening a session while testing

A full session is 90 seconds. Append `?d=<seconds>` to the URL to shorten the
curve during development, e.g. `http://localhost:5173/?d=12`.

## Deployment

Configured for Netlify (`netlify.toml`): build command `npm run build`, publish
directory `dist`, with an SPA fallback redirect.
