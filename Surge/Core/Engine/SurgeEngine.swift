import AVFoundation
import CoreHaptics
import Combine
import Foundation

/// The core somatic state machine driving haptics, audio, and intensity decay.
///
/// `SurgeEngine` owns the full lifecycle of a de-escalation cycle:
/// overload → 90-second decay → cooldown. All sensory output is derived from
/// the single `somaticIntensity` float (1.0 = peak chaos, 0.0 = resting calm).
@MainActor
final class SurgeEngine: ObservableObject {

    // MARK: - Published State

    @Published private(set) var state: SurgeState = .idle
    @Published private(set) var somaticIntensity: Float = 0.0

    /// Normalized heartbeat phase (0.0–1.0) for visual sync at 60 BPM.
    @Published private(set) var heartbeatPhase: Double = 0.0

    // MARK: - Timing Constants

    private let decayDuration: TimeInterval = 90.0
    private let cooldownDuration: TimeInterval = 3.0
    private let fadeOutDuration: TimeInterval = 0.5
    private let targetBPM: Double = 60.0

    // MARK: - Haptics

    private var hapticEngine: CHHapticEngine?
    private var continuousPlayer: CHHapticAdvancedPatternPlayer?

    // MARK: - Audio

    private var chaosPlayer: AVAudioPlayer?
    private var heartbeatPlayer: AVAudioPlayer?

    // MARK: - Timers

    private var decayTimer: Timer?
    private var heartbeatTimer: Timer?
    private var decayStartDate: Date?
    private var fadeOutTimer: Timer?

    // MARK: - Init

    init() {
        prepareHaptics()
        prepareAudio()
    }

    deinit {
        decayTimer?.invalidate()
        heartbeatTimer?.invalidate()
        fadeOutTimer?.invalidate()
    }

    // MARK: - Public API

    /// Begins the Surge cycle: overload → decaying.
    func activate() {
        guard state == .idle || state == .cooldown else { return }

        cancelFadeOut()
        state = .overload
        somaticIntensity = 1.0
        decayStartDate = Date()

        startHapticEngine()
        startAudio()
        updateSensoryOutput()

        // Brief overload beat before decay curve begins.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            guard let self, self.state == .overload else { return }
            self.beginDecay()
        }
    }

    /// User released the dead-man's switch — cut immediately, fade over 0.5 s.
    func release() {
        guard state != .idle else { return }

        decayTimer?.invalidate()
        decayTimer = nil
        state = .idle

        fadeOut(duration: fadeOutDuration) { [weak self] in
            self?.stopAllSensoryOutput()
            self?.somaticIntensity = 0.0
        }
    }

    /// Called when the 90-second decay completes naturally.
    func completeCycle() {
        guard state == .decaying else { return }

        decayTimer?.invalidate()
        decayTimer = nil
        state = .cooldown
        somaticIntensity = 0.0
        updateSensoryOutput()

        DispatchQueue.main.asyncAfter(deadline: .now() + cooldownDuration) { [weak self] in
            guard let self, self.state == .cooldown else { return }
            self.stopAllSensoryOutput()
            self.state = .idle
        }
    }

    // MARK: - Decay Curve

    private func beginDecay() {
        state = .decaying
        decayStartDate = Date()
        startHeartbeatTimer()

        decayTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 60.0, repeats: true) { [weak self] timer in
            Task { @MainActor in
                self?.tickDecay(timer)
            }
        }
    }

    private func tickDecay(_ timer: Timer) {
        guard state == .decaying, let start = decayStartDate else {
            timer.invalidate()
            return
        }

        let elapsed = Date().timeIntervalSince(start)
        let progress = min(elapsed / decayDuration, 1.0)

        // Ease-out cubic: fast initial drop, gentle landing at rest.
        let eased = 1.0 - pow(Float(progress), 0.65)
        somaticIntensity = max(0.0, eased)
        updateSensoryOutput()

        if progress >= 1.0 {
            timer.invalidate()
            completeCycle()
        }
    }

    // MARK: - Heartbeat Phase (60 BPM visual sync)

    private func startHeartbeatTimer() {
        heartbeatTimer?.invalidate()

        let interval = 60.0 / (targetBPM * 60.0) // ~60 fps phase updates
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.tickHeartbeatPhase()
            }
        }
    }

    private func tickHeartbeatPhase() {
        let beatsPerSecond = targetBPM / 60.0
        heartbeatPhase += beatsPerSecond / 60.0
        if heartbeatPhase >= 1.0 { heartbeatPhase -= 1.0 }
    }

    // MARK: - Haptic Engine

    private func prepareHaptics() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }

        do {
            hapticEngine = try CHHapticEngine()
            hapticEngine?.isAutoShutdownEnabled = false
            hapticEngine?.resetHandler = { [weak self] in
                Task { @MainActor in
                    self?.startHapticEngine()
                }
            }
        } catch {
            // Device lacks haptic support — audio-only fallback.
        }
    }

    private func startHapticEngine() {
        guard let engine = hapticEngine else { return }
        do {
            try engine.start()
            try createContinuousPlayer()
        } catch {
            // Non-fatal; crisis audio still functions.
        }
    }

    private func createContinuousPlayer() throws {
        guard let engine = hapticEngine else { return }

        // Base continuous event — intensity/sharpness updated every frame.
        let event = CHHapticEvent(
            eventType: .hapticContinuous,
            parameters: [
                CHHapticEventParameter(parameterID: .hapticIntensity, value: 1.0),
                CHHapticEventParameter(parameterID: .hapticSharpness, value: 1.0)
            ],
            relativeTime: 0,
            duration: 100
        )

        let pattern = try CHHapticPattern(events: [event], parameters: [])
        continuousPlayer = try engine.makeAdvancedPlayer(with: pattern)
        try continuousPlayer?.start(atTime: CHHapticTimeImmediate)
    }

    private func updateHaptics() {
        guard let player = continuousPlayer else { return }

        let intensity = somaticIntensity

        // Sharpness: 1.0 (sharp overload) → 0.05 (dull thud at rest).
        let sharpness = max(0.05, intensity)

        // Cadence: rapid pulses at peak → steady 60 BPM heartbeat at rest.
        // Modulate perceived cadence via transient bursts on the continuous player.
        let dynamicIntensity: Float
        if intensity > 0.15 {
            // Chaotic high-frequency modulation during overload/decay.
            let chaosMod = sin(Date().timeIntervalSinceReferenceDate * Double(intensity) * 12.0)
            dynamicIntensity = intensity * Float(0.7 + 0.3 * abs(chaosMod))
        } else {
            // 60 BPM heartbeat envelope: sharp attack, soft decay per beat.
            let beatPhase = heartbeatPhase
            let envelope = Float(sin(beatPhase * .pi)) // 0→1→0 per beat
            dynamicIntensity = 0.15 + 0.25 * envelope
        }

        do {
            try player.sendParameters([
                CHHapticDynamicParameter(parameterID: .hapticIntensityControl, value: dynamicIntensity, relativeTime: 0),
                CHHapticDynamicParameter(parameterID: .hapticSharpnessControl, value: sharpness, relativeTime: 0)
            ], atTime: CHHapticTimeImmediate)
        } catch {
            // Player may have stopped; attempt restart on next tick.
        }
    }

    // MARK: - Audio Engine

    private func prepareAudio() {
        configureAudioSession()

        chaosPlayer = loadAudio(named: "chaosNoise", loops: true)
        heartbeatPlayer = loadAudio(named: "heartbeat", loops: true)
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            // Audio session failure is non-fatal.
        }
    }

    private func loadAudio(named name: String, loops: Bool) -> AVAudioPlayer? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "mp3")
                ?? Bundle.main.url(forResource: name, withExtension: "wav") else {
            return nil
        }

        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.numberOfLoops = loops ? -1 : 0
            player.prepareToPlay()
            return player
        } catch {
            return nil
        }
    }

    private func startAudio() {
        chaosPlayer?.volume = 1.0
        heartbeatPlayer?.volume = 0.0
        chaosPlayer?.play()
        heartbeatPlayer?.play()
    }

    /// Crossfades chaos noise out and heartbeat in based on `somaticIntensity`.
    private func updateAudio() {
        let t = somaticIntensity // 1.0 = full chaos, 0.0 = full calm

        // Chaos: full volume at 1.0, silent by 0.2 intensity.
        let chaosVolume = max(0.0, min(1.0, (t - 0.2) / 0.8))
        chaosPlayer?.volume = chaosVolume

        // Heartbeat: silent until intensity drops below 0.7, then ramps to calm level.
        let heartbeatVolume = max(0.0, min(0.85, (0.7 - t) / 0.7))
        heartbeatPlayer?.volume = heartbeatVolume

        // Heartbeat playback rate: faster during transition, locked to 1.0 at rest.
        let targetRate = Float(0.85 + 0.15 * (1.0 - t))
        heartbeatPlayer?.enableRate = true
        heartbeatPlayer?.rate = targetRate
    }

    // MARK: - Sensory Output Orchestration

    private func updateSensoryOutput() {
        updateHaptics()
        updateAudio()
    }

    private func stopAllSensoryOutput() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil

        chaosPlayer?.stop()
        heartbeatPlayer?.stop()
        chaosPlayer?.currentTime = 0
        heartbeatPlayer?.currentTime = 0

        try? continuousPlayer?.stop(atTime: CHHapticTimeImmediate)
        continuousPlayer = nil
        hapticEngine?.stop(completionHandler: nil)
    }

    // MARK: - Fade Out

    private func cancelFadeOut() {
        fadeOutTimer?.invalidate()
        fadeOutTimer = nil
    }

    private func fadeOut(duration: TimeInterval, completion: @escaping () -> Void) {
        cancelFadeOut()

        let startIntensity = somaticIntensity
        let startDate = Date()
        let tickInterval = 1.0 / 60.0

        fadeOutTimer = Timer.scheduledTimer(withTimeInterval: tickInterval, repeats: true) { [weak self] timer in
            Task { @MainActor in
                guard let self else {
                    timer.invalidate()
                    return
                }

                let progress = min(Date().timeIntervalSince(startDate) / duration, 1.0)
                self.somaticIntensity = startIntensity * Float(1.0 - progress)
                self.updateSensoryOutput()

                if progress >= 1.0 {
                    timer.invalidate()
                    self.fadeOutTimer = nil
                    completion()
                }
            }
        }
    }
}
