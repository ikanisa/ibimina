import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export interface StatementLineItem {
  date: string;
  description: string;
  debit?: number;
  credit?: number;
  balance: number;
}

export interface StatementPayload {
  memberName: string;
  accountNumber: string;
  periodLabel: string;
  items: StatementLineItem[];
}

function renderTableRows(items: StatementLineItem[]): string {
  return items
    .map((item) => {
      return `
        <tr>
          <td>${item.date}</td>
          <td>${item.description}</td>
          <td class="numeric">${item.debit ? item.debit.toFixed(2) : "-"}</td>
          <td class="numeric">${item.credit ? item.credit.toFixed(2) : "-"}</td>
          <td class="numeric">${item.balance.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("\n");
}

function buildHtml(payload: StatementPayload): string {
  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d0d0d0; padding: 8px; font-size: 12px; }
          th { text-align: left; background: #f8f8f8; }
          td.numeric { text-align: right; }
          caption { text-align: left; font-weight: 600; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <h1>SACCO+ Statement</h1>
        <p><strong>${payload.memberName}</strong><br />Account: ${payload.accountNumber}</p>
        <p>Period: ${payload.periodLabel}</p>
        <table>
          <caption>Transactions</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(payload.items)}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export async function exportStatementToPdf(payload: StatementPayload): Promise<string> {
  const html = buildHtml(payload);
  const { uri } = await Print.printToFileAsync({ html });
  if (!uri) {
    throw new Error("Failed to generate statement PDF");
  }
  return uri;
}

export async function shareStatementPdf(uri: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    console.warn("Device does not support sharing");
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share SACCO+ Statement",
  });
}
