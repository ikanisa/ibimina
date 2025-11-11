import Foundation

struct Transaction: Codable, Identifiable {
    let id: UUID
    let amount: Decimal
    let currency: String
    let counterparty: String
    let createdAt: Date

    init(id: UUID = UUID(),
         amount: Decimal,
         currency: String = "KES",
         counterparty: String,
         createdAt: Date = Date()) {
        self.id = id
        self.amount = amount
        self.currency = currency
        self.counterparty = counterparty
        self.createdAt = createdAt
    }
}
