# AGENTS.md

Surge is a client-only Vite + React + TypeScript single-page app. There is no
backend, database, or auth — it works fully offline once loaded. See
`README.md` for the product brief and the full list of npm scripts.

## Brand guardrails (apply to all UI/copy work)

- **Voice:** calm, commanding, instructional. Tell the user what to do with
  their body ("Press and hold.", "Release when ready."). Never use validation
  ("You did it!"), toxic positivity, gamification, streaks, or badges.
- **Text appears only before the trigger is pressed or after the cooldown.**
  The active and paused states are intentionally text-free.
- **Color is functional only:** true black `#000000`, white `#FFFFFF`, emergency
  amber `#FF9F0A`, charcoal `#1C1C1E`. Dark-mode native.
- **Safety:** keep any strobe ≤ 2.5 Hz at low amplitude and honor
  `prefers-reduced-motion`. This is a crisis tool — never ship aggressive
  flashing.

## Cursor Cloud specific instructions

- **Run the app:** `npm run dev` then open `http://localhost:5173` (Vite binds
  `host: true`). Standard scripts (`lint`, `typecheck`, `build`, `preview`) are
  in `package.json`. There is no test suite yet.
- **Testing shortcut:** a full session is 90s. Append `?d=<seconds>` to the URL
  (e.g. `?d=12`) to shorten the curve so a session completes quickly when
  manually testing the active → complete → Heron handoff flow.
- **The dead-man's switch is pointer-driven:** pressing starts/resumes a
  session; releasing (`pointerup`/`pointercancel`, including lifting outside the
  element) pauses it and the timer holds. To demo completion you must keep the
  pointer held down continuously until the "Begin Recovery (Heron)" button
  appears — releasing early only pauses.
- **Audio/haptics caveats when verifying:** Web Audio only starts from a user
  gesture (the press), so there is no sound until the first hold. The Vibration
  API is a no-op on most desktop browsers (Chrome logs an ignored
  `navigator.vibrate` intervention message — this is expected, not a bug);
  haptics only manifest on supported mobile hardware.
- **Everything (timing, audio, haptics, canvas) runs off one
  `requestAnimationFrame` loop in `src/App.tsx`** reading a shared curve state
  (`src/engine/curve.ts`). The audio (`src/engine/audio.ts`), haptics
  (`src/engine/haptics.ts`), and renderer (`src/render/draw.ts`) are driven from
  there.
