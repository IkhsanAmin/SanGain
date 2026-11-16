export function calculateTransactionFees(input, salePrice = input.sellPrice) {
  const { buyPrice, shares, rates } = input;
  const buyGross = buyPrice * shares;
  const sellGross = salePrice * shares;
  const buyCosts = buyGross * rates.buyFee;
  const sellCosts = sellGross * rates.sellFee;

  return {
    buyGross,
    sellGross,
    buyCosts,
    sellCosts,
    totalCosts: buyCosts + sellCosts
  };
}

export function getSellRetention(rates) {
  return 1 - rates.sellFee;
}
