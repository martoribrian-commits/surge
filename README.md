# Surge

A somatic de-escalation utility for a premium, privacy-first iOS application. Built with native Swift/SwiftUI following a **Slow Tech** aesthetic — hyper-minimal, cinematic, pitch-black, and focused on user sovereignty.

## Architecture

```
Surge/
├── App/
│   └── SurgeApp.swift                 # @main entry point
├── Core/
│   ├── Authentication/
│   │   └── TokenManager.swift         # B2B clinical token auth
│   ├── Engine/
│   │   └── SurgeEngine.swift          # Somatic state machine
│   └── Models/
│       └── SurgeState.swift           # idle | overload | decaying | cooldown
├── Features/
│   ├── Surge/
│   │   └── Views/
│   │       └── SurgeView.swift        # Primary UI + dead-man's switch
│   ├── Recovery/
│   │   └── Views/
│   │       ├── GroundingTextView.swift
│   │       └── HeronRecoveryView.swift
│   └── Authentication/
│       └── Views/
│           └── ClinicalTokenEntryView.swift
└── Resources/
    ├── chaosNoise.mp3                 # Looping chaos bed (add to bundle)
    └── heartbeat.mp3                  # Looping heartbeat (add to bundle)
```

## Core Components

### TokenManager

- Stores a 6-character alphanumeric **Clinical Token** in `UserDefaults`
- Exposes `@Published var isHeronUnlocked: Bool`
- Validates asynchronously via `URLSession` against a Supabase Edge Function
- Network failures are silently swallowed — the crisis flow never blocks on auth

**Configure before shipping:** Replace the placeholder URL in `TokenManager.swift`:

```swift
private let validationEndpoint = URL(string: "https://YOUR_PROJECT.supabase.co/functions/v1/validate-clinical-token")!
```

**Supabase Edge Function contract:**

```json
// POST { "token": "ABC123" }
// 200 → { "valid": true }
// 401/403 → token revoked
```

### SurgeEngine

State machine with four phases:

| State | Duration | Intensity | Sensory Output |
|-------|----------|-----------|----------------|
| `.idle` | — | 0.0 | None |
| `.overload` | ~0.3 s | 1.0 | Max haptics + full chaos audio |
| `.decaying` | 90 s | 1.0 → 0.0 | Eased cubic decay curve |
| `.cooldown` | 3 s | 0.0 | Silence before idle |

**Haptics:** `CHHapticEngine` continuous player with dynamic intensity/sharpness. At peak: sharp, chaotic modulation. At rest: dull 60 BPM heartbeat envelope.

**Audio:** Two looping `AVAudioPlayer` tracks crossfaded by intensity:

- `chaosNoise` — full volume at 1.0, silent below 0.2
- `heartbeat` — ramps in below 0.7 intensity, rate locked to calm at rest

### SurgeView

- Full-screen pitch-black canvas
- **Dead-man's switch:** `LongPressGesture` → `DragGesture(minimumDistance: 0)` sequence
- Release instantly triggers 0.5 s fade-out via `engine.release()`
- **Visual layers:**
  - Intensity > 0.3: 1 Hz alpha strobe (photosensitive-safe)
  - Intensity ≤ 0.3: radial breathing gradient synced to 60 BPM
- **Post-cycle routing:**
  - `isHeronUnlocked` → `HeronRecoveryView`
  - Otherwise → `GroundingTextView` with token entry option

## Setup

1. Create a new **iOS App** project in Xcode (SwiftUI, iOS 17+)
2. Copy the `Surge/` directory into the project
3. Add audio assets to the bundle:
   - `chaosNoise.mp3` — textured noise bed
   - `heartbeat.mp3` — single heartbeat sample (looped)
4. Enable **Haptic Capability** in Signing & Capabilities
5. Add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## Requirements

- iOS 17.0+
- Device with Taptic Engine (haptics gracefully degrade on unsupported hardware)
- Xcode 15+

## Privacy

- No accounts, no PII
- Clinical tokens are anonymous 6-character codes
- Token validation is optional background I/O
- All somatic output runs fully offline

## License

Proprietary — Surge Health
