export function formatGroupedInteger(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseGroupedInteger(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export function guessSizeClass(value: string) {
  const length = value.length;
  if (length > 21) return "guess-value-xlong";
  if (length > 16) return "guess-value-long";
  if (length > 12) return "guess-value-medium";
  return "guess-value-short";
}

export function formatDisplayNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
