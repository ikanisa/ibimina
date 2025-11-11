const DEFAULT_LOCALE = "rw-RW";
const DEFAULT_CURRENCY = "RWF";
const DEFAULT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  options?: Intl.NumberFormatOptions;
}

export function fmtCurrency(
  value: number | null | undefined,
  { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY, options = {} }: CurrencyFormatOptions = {}
): string {
  const amount = typeof value === "number" && Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(locale, {
    ...DEFAULT_OPTIONS,
    currency,
    ...options,
  }).format(amount);
}
