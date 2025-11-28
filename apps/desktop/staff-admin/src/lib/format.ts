// Format utilities
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatCurrency(value: number, currency = 'RWF'): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('rw-RW').format(new Date(date));
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
