import SwiftUI

struct TransactionsView: View {
    @EnvironmentObject private var supabase: SupabaseService

    var body: some View {
        List {
            ForEach(supabase.transactions) { transaction in
                VStack(alignment: .leading, spacing: 4) {
                    Text(transaction.amount.formattedCurrency(code: transaction.currency))
                        .font(.headline)
                    Text(transaction.counterparty)
                        .font(.subheadline)
                    Text(transaction.createdAt, style: .date)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .task {
            supabase.loadTransactions()
        }
        .navigationTitle("Transactions")
    }
}

private extension Decimal {
    func formattedCurrency(code: String) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = code
        return formatter.string(from: NSDecimalNumber(decimal: self)) ?? "--"
    }
}

struct TransactionsView_Previews: PreviewProvider {
    static var previews: some View {
        TransactionsView()
            .environmentObject(SupabaseService.shared)
    }
}
