import SwiftUI

/// Minimal clinical token entry sheet.
struct ClinicalTokenEntryView: View {

    @ObservedObject var tokenManager: TokenManager
    @Environment(\.dismiss) private var dismiss

    @State private var tokenInput = ""
    @FocusState private var isFocused: Bool

    private var isValidFormat: Bool {
        tokenInput.count == 6 && tokenInput.allSatisfy(\.isLetter || \.isNumber)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 40) {
                Spacer()

                Text("Clinical Token")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(.white.opacity(0.4))
                    .tracking(2)

                TextField("", text: $tokenInput)
                    .focused($isFocused)
                    .font(.system(size: 32, weight: .light, design: .monospaced))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .onChange(of: tokenInput) { _, newValue in
                        tokenInput = String(newValue.uppercased().prefix(6))
                    }
                    .frame(maxWidth: 240)

                Rectangle()
                    .fill(Color.white.opacity(0.15))
                    .frame(width: 240, height: 0.5)

                Text("Provided by your care clinic.")
                    .font(.system(size: 12, weight: .light))
                    .foregroundStyle(.white.opacity(0.3))

                Spacer()

                Button {
                    tokenManager.submitToken(tokenInput)
                    dismiss()
                } label: {
                    Text("Unlock")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(isValidFormat ? .white.opacity(0.8) : .white.opacity(0.2))
                        .tracking(1.2)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 32)
                        .overlay(
                            RoundedRectangle(cornerRadius: 0)
                                .stroke(Color.white.opacity(isValidFormat ? 0.3 : 0.1), lineWidth: 0.5)
                        )
                }
                .disabled(!isValidFormat)
                .padding(.bottom, 60)
            }
        }
        .preferredColorScheme(.dark)
        .onAppear { isFocused = true }
    }
}

#Preview {
    ClinicalTokenEntryView(tokenManager: TokenManager())
}
