import { calculateTransactionFees, getSellRetention } from "./fees.js";

export function calculateTrade(input, salePrice = input.sellPrice) {
  const fees = calculateTransactionFees(input, salePrice);
  const capital = fees.buyGross + fees.buyCosts;
  const proceeds = fees.sellGross - fees.sellCosts;
  const net = proceeds - capital;

  return {
    ...fees,
    capital,
    proceeds,
    net,
    grossGain: fees.sellGross - fees.buyGross,
    returnPct: capital ? (net / capital) * 100 : 0
  };
}

export function calculateRequiredSalePrice(input, targetPct) {
  const { shares, rates } = input;
  const { buyGross, buyCosts } = calculateTransactionFees(input, 0);
  const capital = buyGross + buyCosts;
  const sellRetention = getSellRetention(rates);

  if (sellRetention <= 0 || !Number.isFinite(targetPct) || targetPct < 0) {
    return null;
  }

  // Small epsilon guards against floating-point noise pushing an exact price up by 1.
  return Math.ceil((capital * (1 + targetPct / 100)) / (shares * sellRetention) - 1e-9);
}

export function createProfitScenarios(input) {
  return [-5, -2, 0, 2, 5, 10, 15].map((change) => {
    const salePrice = Math.max(1, Math.round(input.buyPrice * (1 + change / 100)));
    return {
      change,
      salePrice,
      result: calculateTrade(input, salePrice)
    };
  });
}
