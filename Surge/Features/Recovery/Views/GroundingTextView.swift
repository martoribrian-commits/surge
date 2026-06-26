import SwiftUI

/// Offline grounding screen shown after a Surge cycle when Heron is locked.
///
/// Presents calm, minimal copy and an optional path to enter a clinical token.
struct GroundingTextView: View {

    @ObservedObject var tokenManager: TokenManager
    let onEnterToken: () -> Void
    let onDismiss: () -> Void

    @State private var visibleLines: Int = 0

    private let groundingLines = [
        "You are here.",
        "Your body is slowing down.",
        "Notice the weight of your feet.",
        "Notice the air entering your lungs.",
        "You are safe in this moment."
    ]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 48) {
                Spacer()

                VStack(spacing: 24) {
                    ForEach(Array(groundingLines.prefix(visibleLines).enumerated()), id: \.offset) { _, line in
                        Text(line)
                            .font(.system(size: 20, weight: .light, design: .default))
                            .foregroundStyle(.white.opacity(0.85))
                            .multilineTextAlignment(.center)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .padding(.horizontal, 40)

                Spacer()

                VStack(spacing: 16) {
                    if !tokenManager.isHeronUnlocked {
                        Button(action: onEnterToken) {
                            Text("Enter Clinical Token")
                                .font(.system(size: 14, weight: .regular))
                                .foregroundStyle(.white.opacity(0.5))
                                .tracking(1.2)
                        }
                    }

                    Button(action: onDismiss) {
                        Text("Done")
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
                }
                .padding(.bottom, 60)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { revealLinesSequentially() }
    }

    private func revealLinesSequentially() {
        for index in 0..<groundingLines.count {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * 1.8) {
                withAnimation(.easeIn(duration: 0.8)) {
                    visibleLines = index + 1
                }
            }
        }
    }
}

#Preview {
    GroundingTextView(
        tokenManager: TokenManager(),
        onEnterToken: {},
        onDismiss: {}
    )
}
