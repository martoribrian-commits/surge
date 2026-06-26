import SwiftUI

/// Post-cycle destination after a completed Surge session.
enum SurgeCompletionRoute: Identifiable, Equatable {
    case heronRecovery
    case grounding

    var id: String {
        switch self {
        case .heronRecovery: return "heron"
        case .grounding: return "grounding"
        }
    }
}

/// The primary somatic de-escalation interface.
///
/// Implements a dead-man's switch: the user must press and hold the screen
/// for the entire Surge cycle. Releasing instantly cuts sensory output and
/// fades out over 0.5 seconds.
struct SurgeView: View {

    @StateObject private var engine = SurgeEngine()
    @ObservedObject var tokenManager: TokenManager

    @State private var isPressed = false
    @State private var completionRoute: SurgeCompletionRoute?
    @State private var showTokenEntry = false

    /// Minimum hold duration before activation (prevents accidental triggers).
    private let activationDelay: TimeInterval = 0.15

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Layer 1: Visual somatic feedback
            visualLayer

            // Layer 2: Invisible touch target covering full screen
            touchSurface
        }
        .preferredColorScheme(.dark)
        .statusBarHidden(true)
        .onChange(of: engine.state) { _, newState in
            handleStateTransition(newState)
        }
        .fullScreenCover(item: $completionRoute) { route in
            switch route {
            case .heronRecovery:
                HeronRecoveryView(onDismiss: { completionRoute = nil })
            case .grounding:
                GroundingTextView(
                    tokenManager: tokenManager,
                    onEnterToken: { showTokenEntry = true },
                    onDismiss: { completionRoute = nil }
                )
            }
        }
        .sheet(isPresented: $showTokenEntry) {
            ClinicalTokenEntryView(tokenManager: tokenManager)
        }
    }

    // MARK: - Visual Layer

    @ViewBuilder
    private var visualLayer: some View {
        ZStack {
            if engine.somaticIntensity > 0.3 {
                // High-intensity: safe alpha strobe (~1 Hz, well below photosensitive threshold)
                StrobeOverlay(intensity: engine.somaticIntensity)
                    .transition(.opacity)
            }

            if engine.somaticIntensity <= 0.3 && engine.state != .idle {
                // Low-intensity: breathing radial gradient synced to 60 BPM heartbeat
                BreathingGradientOverlay(
                    phase: engine.heartbeatPhase,
                    intensity: engine.somaticIntensity
                )
                .transition(.opacity)
            }

            // Subtle hold indicator when idle
            if engine.state == .idle && isPressed {
                holdIndicator
            }
        }
        .animation(.easeInOut(duration: 0.6), value: engine.somaticIntensity > 0.3)
    }

    private var holdIndicator: some View {
        Circle()
            .strokeBorder(Color.white.opacity(0.12), lineWidth: 1)
            .frame(width: 120, height: 120)
            .scaleEffect(isPressed ? 0.92 : 1.0)
            .animation(.easeOut(duration: 0.2), value: isPressed)
    }

    // MARK: - Dead-Man's Switch

    private var touchSurface: some View {
        Color.clear
            .contentShape(Rectangle())
            .gesture(deadManSwitchGesture)
    }

    /// Combined long-press + drag gesture ensures the finger cannot lift unnoticed.
    private var deadManSwitchGesture: some Gesture {
        LongPressGesture(minimumDuration: activationDelay)
            .sequenced(before: DragGesture(minimumDistance: 0))
            .onChanged { value in
                switch value {
                case .second(true, _):
                    if !isPressed {
                        isPressed = true
                        engine.activate()
                    }
                default:
                    break
                }
            }
            .onEnded { _ in
                isPressed = false
                engine.release()
            }
    }

    // MARK: - Completion Routing

    private func handleStateTransition(_ newState: SurgeState) {
        guard newState == .cooldown else { return }

        // Route after natural cycle completion (not on manual release).
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if tokenManager.isHeronUnlocked {
                completionRoute = .heronRecovery
            } else {
                completionRoute = .grounding
            }
        }
    }
}

// MARK: - Strobe Overlay

/// High-contrast alpha strobe at a photosensitive-safe frequency (~1 Hz).
///
/// Frequency is capped at 1.0 Hz (one full on/off cycle per second), well below
/// the 3–30 Hz range associated with photosensitive epilepsy triggers.
private struct StrobeOverlay: View {
    let intensity: Float

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let elapsed = timeline.date.timeIntervalSinceReferenceDate
            // 1 Hz strobe: sin wave mapped to 0.0–1.0 alpha range.
            let strobePhase = sin(elapsed * 2.0 * .pi * 1.0)
            let alpha = Double(intensity) * (0.08 + 0.12 * max(0, strobePhase))

            Rectangle()
                .fill(Color.white.opacity(alpha))
                .ignoresSafeArea()
                .allowsHitTesting(false)
        }
    }
}

// MARK: - Breathing Gradient Overlay

/// Slow expanding/contracting radial gradient synced to 60 BPM heartbeat.
private struct BreathingGradientOverlay: View {
    let phase: Double
    let intensity: Float

    var body: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            let maxRadius = max(geometry.size.width, geometry.size.height) * 0.6

            // Sine envelope: expand on beat, contract between beats.
            let breathScale = 0.4 + 0.6 * sin(phase * .pi)
            let radius = maxRadius * breathScale
            let opacity = Double(1.0 - intensity) * 0.15

            RadialGradient(
                gradient: Gradient(colors: [
                    Color.white.opacity(opacity),
                    Color.white.opacity(opacity * 0.3),
                    Color.clear
                ]),
                center: UnitPoint(
                    x: center.x / geometry.size.width,
                    y: center.y / geometry.size.height
                ),
                startRadius: 0,
                endRadius: radius
            )
            .ignoresSafeArea()
            .allowsHitTesting(false)
        }
    }
}

// MARK: - Preview

#Preview {
    SurgeView(tokenManager: TokenManager())
}
