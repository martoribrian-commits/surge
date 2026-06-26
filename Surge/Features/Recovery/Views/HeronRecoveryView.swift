import SwiftUI

/// Heron AI recovery guide — unlocked via clinical token.
///
/// Placeholder shell for the premium post-Surge recovery engine.
/// Wire your Heron conversation / somatic coaching module here.
struct HeronRecoveryView: View {

    let onDismiss: () -> Void

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                Text("Heron")
                    .font(.system(size: 28, weight: .ultraLight))
                    .foregroundStyle(.white.opacity(0.9))
                    .tracking(6)

                Text("Your somatic guide is ready.")
                    .font(.system(size: 16, weight: .light))
                    .foregroundStyle(.white.opacity(0.5))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 48)

                Spacer()

                Button(action: onDismiss) {
                    Text("Continue")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.white.opacity(0.7))
                        .tracking(1.2)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 32)
                        .overlay(
                            RoundedRectangle(cornerRadius: 0)
                                .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
                        )
                }
                .padding(.bottom, 60)
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    HeronRecoveryView(onDismiss: {})
}
