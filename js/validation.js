const INPUT_IDS = ["buyPrice", "lots", "buyFee", "sellPrice", "sellFee"];

const getElement = (id) => document.getElementById(id);
const toRate = (value) => Number.isFinite(value) && value >= 0 && value <= 100
  ? value / 100
  : Number.NaN;

export function readCalculatorInputs() {
  const fields = Object.fromEntries(INPUT_IDS.map((id) => [id, getElement(id)]));
  const value = (id) => Number(fields[id].value);

  const buyPrice = value("buyPrice");
  const sellPrice = value("sellPrice");
  const lots = value("lots");
  const rates = {
    buyFee: toRate(value("buyFee")),
    sellFee: toRate(value("sellFee"))
  };

  const invalid = !Number.isFinite(buyPrice) || buyPrice <= 0
    || !Number.isFinite(sellPrice) || sellPrice <= 0
    || !Number.isInteger(lots) || lots <= 0
    || Object.values(rates).some((rate) => !Number.isFinite(rate));

  return { buyPrice, sellPrice, lots, shares: lots * 100, rates, invalid };
}

export function validateCalculatorInputs(input) {
  if (input.invalid) {
    return {
      valid: false,
      message: "Masukkan harga di atas 0, jumlah lot bilangan bulat, dan fee antara 0–100%."
    };
  }
  return { valid: true, message: "" };
}
