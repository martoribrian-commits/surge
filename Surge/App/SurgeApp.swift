import SwiftUI

@main
struct SurgeApp: App {

    @StateObject private var tokenManager = TokenManager()

    var body: some Scene {
        WindowGroup {
            SurgeView(tokenManager: tokenManager)
        }
    }
}
