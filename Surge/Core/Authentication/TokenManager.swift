import Foundation

/// Manages anonymous B2B "Clinical Tokens" issued by healthcare clinics.
///
/// Tokens unlock premium features (e.g. Heron AI guide) without requiring
/// personal accounts. Validation is fire-and-forget — network failures never
/// block the core crisis experience.
@MainActor
final class TokenManager: ObservableObject {

    // MARK: - Published State

    /// Whether a valid clinical token is cached locally and Heron is unlocked.
    @Published private(set) var isHeronUnlocked: Bool = false

    /// The currently cached token, if any.
    @Published private(set) var clinicalToken: String?

    // MARK: - Constants

    private enum StorageKey {
        static let clinicalToken = "surge.clinicalToken"
        static let heronUnlocked = "surge.isHeronUnlocked"
    }

    /// Supabase Edge Function endpoint for token validation.
    /// Replace with your deployed function URL before shipping.
    private let validationEndpoint = URL(string: "https://YOUR_PROJECT.supabase.co/functions/v1/validate-clinical-token")!

    /// Expected token format: exactly 6 alphanumeric characters.
    private static let tokenPattern = /^[A-Za-z0-9]{6}$/

    // MARK: - Init

    init() {
        loadCachedToken()
    }

    // MARK: - Public API

    /// Persists a token locally and kicks off async server validation.
    /// Returns immediately — the crisis UI is never blocked on network I/O.
    func submitToken(_ rawToken: String) {
        let normalized = rawToken.uppercased().trimmingCharacters(in: .whitespacesAndNewlines)

        guard normalized.wholeMatch(of: Self.tokenPattern) != nil else {
            return
        }

        clinicalToken = normalized
        UserDefaults.standard.set(normalized, forKey: StorageKey.clinicalToken)

        // Optimistically unlock for offline-first UX; server can revoke later.
        setHeronUnlocked(true)

        Task.detached(priority: .utility) { [weak self] in
            await self?.validateTokenRemotely(normalized)
        }
    }

    /// Clears all token state (e.g. on sign-out or token revocation).
    func clearToken() {
        clinicalToken = nil
        setHeronUnlocked(false)
        UserDefaults.standard.removeObject(forKey: StorageKey.clinicalToken)
        UserDefaults.standard.removeObject(forKey: StorageKey.heronUnlocked)
    }

    // MARK: - Private — Local Cache

    private func loadCachedToken() {
        guard let cached = UserDefaults.standard.string(forKey: StorageKey.clinicalToken),
              cached.wholeMatch(of: Self.tokenPattern) != nil else {
            return
        }

        clinicalToken = cached
        isHeronUnlocked = UserDefaults.standard.bool(forKey: StorageKey.heronUnlocked)

        // Re-validate in background on launch; failures are silently ignored.
        Task.detached(priority: .utility) { [weak self] in
            await self?.validateTokenRemotely(cached)
        }
    }

    private func setHeronUnlocked(_ unlocked: Bool) {
        isHeronUnlocked = unlocked
        UserDefaults.standard.set(unlocked, forKey: StorageKey.heronUnlocked)
    }

    // MARK: - Private — Remote Validation

    /// Validates the token against a Supabase Edge Function via native URLSession.
    ///
    /// Network failures, timeouts, and server errors are intentionally swallowed
    /// so the somatic engine never stalls waiting for auth.
    nonisolated private func validateTokenRemotely(_ token: String) async {
        var request = URLRequest(url: validationEndpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: String] = ["token": token]
        request.httpBody = try? JSONEncoder().encode(body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else { return }

            switch httpResponse.statusCode {
            case 200:
                let result = try JSONDecoder().decode(ValidationResponse.self, from: data)
                await MainActor.run { [weak self] in
                    self?.setHeronUnlocked(result.valid)
                    if !result.valid {
                        self?.clinicalToken = nil
                        UserDefaults.standard.removeObject(forKey: StorageKey.clinicalToken)
                    }
                }

            case 401, 403:
                await MainActor.run { [weak self] in
                    self?.clearToken()
                }

            default:
                // Transient server error — keep cached state, retry next launch.
                break
            }
        } catch {
            // Network unreachable, timeout, etc. — crisis flow continues unaffected.
        }
    }
}

// MARK: - Response Model

private struct ValidationResponse: Decodable, Sendable {
    let valid: Bool
}
