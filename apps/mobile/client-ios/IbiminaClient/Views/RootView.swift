import SwiftUI

struct RootView: View {
    @ObservedObject private var authService = SupabaseService.shared

    var body: some View {
        Group {
            if let memberId = authService.memberId {
                ContentView(memberId: memberId)
            } else {
                AuthFlowView()
            }
        }
        .animation(.easeInOut, value: authService.memberId != nil)
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
    }
}
