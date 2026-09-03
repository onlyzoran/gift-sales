export function getNominalUnitPriceRub(
  priceRub: number,
  faceValue: number,
): number | null {
  if (
    !Number.isFinite(priceRub) ||
    !Number.isFinite(faceValue) ||
    faceValue <= 0
  ) {
    return null;
  }

  return priceRub / faceValue;
}

const nominalUnitPriceFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNominalUnitPrice(
  priceRub: number,
  faceValue: number,
  faceCurrency: string,
): string {
  const unitPrice = getNominalUnitPriceRub(priceRub, faceValue);
  if (unitPrice === null) {
    return "—";
  }

  return `${nominalUnitPriceFormatter.format(unitPrice)} ₽ / ${faceCurrency}`;
}

export function nominalUnitPriceColumnTitle(faceCurrencies: string[]): string {
  const uniqueCurrencies = [...new Set(faceCurrencies.filter(Boolean))];

  if (uniqueCurrencies.length === 1) {
    return `₽ за 1 ${uniqueCurrencies[0]}`;
  }

  return "₽ за 1 ед. номинала";
}

export function compareNominalUnitPrice(
  priceRubA: number,
  faceValueA: number,
  priceRubB: number,
  faceValueB: number,
  sortOrder?: "ascend" | "descend" | null,
): number {
  const valueA = getNominalUnitPriceRub(priceRubA, faceValueA);
  const valueB = getNominalUnitPriceRub(priceRubB, faceValueB);

  if (valueA === null && valueB === null) {
    return 0;
  }

  if (valueA === null) {
    return sortOrder === "descend" ? -1 : 1;
  }

  if (valueB === null) {
    return sortOrder === "descend" ? 1 : -1;
  }

  return valueA - valueB;
}
