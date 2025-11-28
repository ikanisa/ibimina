// Utility functions for formatting

export function formatCurrency(amount: number, currency = 'RWF'): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-RW').format(num);
}
