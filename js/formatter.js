const rupiahFormatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatMoney(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `Rp ${rupiahFormatter.format(Math.round(safeValue))}`;
}

export function formatNumber(value) {
  return rupiahFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value) {
  // `|| 0` normalises -0 so tiny negatives never render as "-0,00%".
  const safeValue = (Number.isFinite(value) ? Math.round(value * 100) / 100 : 0) || 0;
  const sign = safeValue > 0 ? "+" : "";
  return `${sign}${safeValue.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}%`;
}
