import { calculateTrade, calculateRequiredSalePrice, createProfitScenarios } from "./calculator.js";
import { formatMoney, formatNumber, formatPercent } from "./formatter.js";
import { readCalculatorInputs, validateCalculatorInputs } from "./validation.js";

const $ = (id) => document.getElementById(id);
const inputIds = ["buyPrice", "lots", "buyFee", "sellPrice", "sellFee", "customTarget"];

let debounceTimer;

// localStorage can throw (private mode, blocked storage) — never let that break the app.
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

function targetValue() {
  const chosen = $("targetRate").value;
  return chosen === "custom" ? Number($("customTarget").value) : Number(chosen);
}

function syncOptionalFields() {
  $("customTargetField").hidden = $("targetRate").value !== "custom";
}

function debouncedRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(render, 300);
}

function loadState() {
  try {
    const state = JSON.parse(storage.get("stockGainState"));
    if (state) {
      Object.entries(state).forEach(([id, value]) => {
        if ($(id)) $(id).value = value;
      });
    }
  } catch {}
}

function saveState() {
  const state = Object.fromEntries(inputIds.map(id => [id, $(id).value]));
  state.targetRate = $("targetRate").value;
  storage.set("stockGainState", JSON.stringify(state));
}

function clearState() {
  storage.remove("stockGainState");
}

function renderTargets(input) {
  const target = targetValue();
  const targetPrice = calculateRequiredSalePrice(input, target);
  $("targetPrice").textContent = targetPrice === null ? "Tidak tersedia" : formatMoney(targetPrice);
  $("targetCaption").textContent = Number.isFinite(target)
    ? `Untuk mencapai target net return ${target.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`
    : "Masukkan target return yang valid.";

  const breakEven = calculateRequiredSalePrice(input, 0);
  $("breakEvenPrice").textContent = breakEven === null ? "Tidak tersedia" : formatMoney(breakEven);
  if (breakEven !== null) {
    const result = calculateTrade(input, breakEven);
    $("breakEvenCaption").textContent = `Estimasi hasil bersih ${result.net >= 0 ? "+" : "−"}${formatMoney(Math.abs(result.net))} · dibulatkan ke atas`;
  } else {
    $("breakEvenCaption").textContent = "Periksa kembali persentase biaya transaksi.";
  }
}

function renderScenarios(input) {
  const scenarios = createProfitScenarios(input);
  $("simulationRows").innerHTML = scenarios.map(({ change, salePrice, result }) => {
    const className = result.net >= 0 ? "positive" : "negative";
    const label = `${change > 0 ? "+" : ""}${change}%`;
    const sign = result.net >= 0 ? "+" : "−";
    return `<tr><td>${label}</td><td>${formatMoney(salePrice)}</td><td class="${className}">${sign}${formatMoney(Math.abs(result.net))}</td><td class="${className}">${formatPercent(result.returnPct)}</td></tr>`;
  }).join("");

  $("mobileScenarios").innerHTML = scenarios.map(({ change, salePrice, result }) => {
    const className = result.net >= 0 ? "positive" : "negative";
    const label = `${change > 0 ? "+" : ""}${change}%`;
    const sign = result.net >= 0 ? "+" : "−";
    return `<div class="scenario-card"><span>Perubahan ${label}</span><strong>${formatMoney(salePrice)}</strong><em class="${className}">${sign}${formatMoney(Math.abs(result.net))}</em><small class="${className}">${formatPercent(result.returnPct)} net return</small></div>`;
  }).join("");
}

function render() {
  const input = readCalculatorInputs();
  const validation = validateCalculatorInputs(input);
  $("validation").textContent = validation.message;
  
  if (!validation.valid) {
    $("profitCard").classList.add("invalid");
    return;
  }
  
  $("profitCard").classList.remove("invalid");
  saveState();

  const result = calculateTrade(input);
  const isProfit = result.net >= 0;
  $("profitCard").classList.toggle("loss", !isProfit);
  $("resultLabel").textContent = isProfit ? "Net Profit" : "Net Loss";
  $("resultChip").textContent = isProfit ? "Profit" : "Loss";
  $("netProfit").textContent = `${isProfit ? "+" : "−"}${formatMoney(Math.abs(result.net))}`;
  $("netReturn").textContent = formatPercent(result.returnPct);
  $("totalCapital").textContent = formatMoney(result.capital);
  $("saleProceeds").textContent = formatMoney(result.proceeds);
  $("buyGross").textContent = formatMoney(result.buyGross);
  $("buyFeeValue").textContent = formatMoney(result.buyCosts);
  $("sellGross").textContent = formatMoney(result.sellGross);
  $("sellFeeValue").textContent = formatMoney(result.sellCosts);

  $("totalCosts").textContent = formatMoney(result.totalCosts);
  $("grossGain").textContent = `${result.grossGain >= 0 ? "+" : "−"}${formatMoney(Math.abs(result.grossGain))}`;
  $("netProfitDetail").textContent = `${result.net >= 0 ? "+" : "−"}${formatMoney(Math.abs(result.net))}`;
  $("profitFoot").textContent = `${formatNumber(input.shares)} lembar saham · ${input.lots} lot`;
  
  const absReturn = Math.abs(result.returnPct);
  const barWidth = Math.min(100, (absReturn / 30) * 100);
  $("returnBar").style.width = `${barWidth}%`;
  $("returnBar").style.background = isProfit ? "var(--profit)" : "var(--loss)";

  renderTargets(input);
  renderScenarios(input);
}

function resetCalculator() {
  clearState();
  const defaults = {
    buyPrice: 1000,
    lots: 10,
    buyFee: 0.15,
    sellPrice: 1100,
    sellFee: 0.25,
    customTarget: 12
  };

  Object.entries(defaults).forEach(([id, value]) => { $(id).value = value; });
  $("targetRate").value = "10";
  syncOptionalFields();
  render();
}

export function initializeUI() {
  const toggle = $("themeToggle");
  const storedTheme = storage.get("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const updateThemeIcon = (theme) => {
    toggle.querySelector("span").textContent = theme === "dark" ? "☀" : "☾";
    toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    storage.set("theme", theme);
    updateThemeIcon(theme);
  };

  if (storedTheme) {
    setTheme(storedTheme);
  } else if (prefersDark) {
    setTheme("dark");
  } else {
    updateThemeIcon("light");
  }

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  });

  loadState();

  [...inputIds.map((id) => $(id)), $("targetRate")]
    .forEach((element) => {
      element.addEventListener("input", () => { syncOptionalFields(); debouncedRender(); });
      element.addEventListener("change", () => { syncOptionalFields(); debouncedRender(); });
    });

  $("resetBtn").addEventListener("click", resetCalculator);
  syncOptionalFields();
  render();
}
