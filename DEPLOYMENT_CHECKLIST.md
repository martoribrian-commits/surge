# Surge Release 1.33 — TestFlight / Alpha Deployment Checklist

Human-in-the-loop validation steps before external submission. Complete every item on a physical device (not simulator-only).

---

## 1. Zero-Gate Accessibility

- [ ] Launch Surge cold — confirm **no authentication modal** intercepts the user before sequence selection.
- [ ] Tap **Begin** on any sequence (30 / 60 / 90) without creating an account or entering a token.
- [ ] Verify `/crane` is reachable only after explicit user navigation — not forced mid-sequence.
- [ ] Confirm clinical token portal (`/portal`) does not block the somatic circuit breaker entry path.
- [ ] Test with airplane mode: local sequences must still run; Crane shows held-locally fallback without crash.

**Pass criteria:** A user in acute distress can reach a tactile anchor within two taps, zero credentials.

---

## 2. Visual Asset Consistency (Dark Canvas / Minimal Glow)

- [ ] Entry screen uses `#0A0A0A` canvas with clay/bone copy (`#F4F0EB`) — no stray light backgrounds.
- [ ] Film grain overlay renders on entry, engine, and decompression views without banding.
- [ ] Variant accent glows match palette: Instant Reset (ember), Orienting Anchor (clay/fern), Coherence Ripple (deep green).
- [ ] HUD typography: uppercase tracking on labels; no gamified scores, streaks, or badges.
- [ ] Pause overlay and completion veil fade respect cinematic ease (`~0.9–1.6s`), not snappy UI transitions.
- [ ] Compare against brand v1.1 logomark/decay curve on `/about` — tone must feel cohesive.

**Pass criteria:** Every screen reads as one premium, secular, privacy-first product — not a clinical dashboard.

---

## 3. Medical Disclaimer & Legal Structure

- [ ] Navigate to **`/terms`** — medical disclaimer blockquote is **structurally visible** above the fold on mobile (375px width).
- [ ] Disclaimer states Surge is **not** medical advice, diagnosis, or emergency care.
- [ ] Footer links on entry view resolve: Privacy → `/privacy`, Terms → `/terms`, Support → `/support`.
- [ ] Privacy page documents Crane 24-hour ephemeral default and opt-in local save.
- [ ] Support contact form submits (or queues) without exposing conversation text to third-party analytics.

**Pass criteria:** Legal copy is present, readable, and unmodified from approved release text before App Store / TestFlight metadata submission.

---

## 4. Somatosensory Calibration (Native Bridge)

- [ ] **Instant Reset (30s):** Sharp double-pulse fires at start; continuous decay vibration runs through parasympathetic phase.
- [ ] **Orienting Anchor (60s):** Bilateral taps produce left/right panned gentle thuds at ~60 BPM rhythm.
- [ ] **Coherence Ripple (90s):** Hold engages 4s swell / 6s ebb breathing haptic; release instantly kills loop.
- [ ] Releasing tactile anchor or navigating away **immediately stops** all haptics and audio — no ghost vibration.
- [ ] Background app switch during sequence triggers `pagehide` cleanup (no haptic leak on return).

**Pass criteria:** Haptic profiles match `HapticProfiles` spec; `killAll()` verified on release and unmount.

---

## 5. Sovereignty Stack (Data Expiration)

- [ ] Crane decompression defaults to **ephemeral** — retention label shows 24-hour auto-delete.
- [ ] Toggle **Save Insights Locally** ON — thread survives app restart within 24h+ window.
- [ ] Toggle OFF (or leave ephemeral) — after 24h simulated TTL, thread is **irreversibly purged**.
- [ ] Inspect localStorage: no Crane message text in telemetry queue keys.
- [ ] Confirm no conversation payloads appear in Sentry / console aggregators during Crane use.

**Pass criteria:** `useEphemeralStorage` mount purge and Vitest sovereignty suite pass in CI.

---

## 6. Performance & Friction Audit

- [ ] Dev overlay reports TTI < 3000ms on target hardware (iPhone 12 class or equivalent).
- [ ] Sequence picker tab switch (30/60/90) updates preview without full page reload.
- [ ] Deep links work: `/engine/instant-reset`, `/engine/orienting-anchor`, `/engine/coherence-ripple`.
- [ ] `/heron` and `/egret` redirect to `/crane` without flash of wrong branding.

**Pass criteria:** Zero friction from cold launch to first tactile input on production build.

---

## 7. Pre-Submission Sign-Off

| Role | Name | Date | OK |
|------|------|------|-----|
| Engineering | | | ☐ |
| QA | | | ☐ |
| Product / Clinical Advisor | | | ☐ |

**Build fingerprint:** ____________________  
**TestFlight build number:** ____________________

---

*Martori Studio — Surge Release 1.33. Secular. Premium. Privacy-first.*
