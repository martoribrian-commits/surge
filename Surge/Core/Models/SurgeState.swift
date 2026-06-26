import Foundation

/// The four phases of a Surge somatic de-escalation cycle.
///
/// Transitions: `.idle` → `.overload` → `.decaying` → `.cooldown` → `.idle`
enum SurgeState: Equatable, Sendable {
    /// No active session; engine is dormant.
    case idle

    /// Initial chaos phase — intensity pinned at 1.0, max haptic/audio load.
    case overload

    /// The 90-second decay curve — intensity interpolates 1.0 → 0.0.
    case decaying

    /// Post-cycle resting phase before returning to idle.
    case cooldown
}
