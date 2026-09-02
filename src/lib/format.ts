const rubFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function formatPriceRub(value: number): string {
  return rubFormatter.format(value);
}

export function formatFaceValue(value: number, currency: string): string {
  return `${value} ${currency}`;
}

export function formatDiscountPct(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${value}%`;
}
