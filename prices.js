const COINGECKO_BRL_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl";

async function fetchJson(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return response.json();
}

function parseFiatPrice(prices, currency = getDisplayCurrency()) {
  if (!prices || typeof prices !== "object") return 0;

  const raw = prices[currency] ?? prices[currency.toLowerCase()];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getFiatPrice() {
  return parseFiatPrice(AppState.cachedPrices);
}

function buildFiatText(confirmedBtc) {
  const price = getFiatPrice();
  const currency = getDisplayCurrency();
  return `≈ ${formatFiat(confirmedBtc * price)} ${currency}`;
}

async function fetchBrlPrice() {
  try {
    const data = await fetchJson(COINGECKO_BRL_PRICE_URL);
    const brl = Number(data?.bitcoin?.brl);
    if (Number.isFinite(brl) && brl > 0) {
      AppState.cachedPrices.BRL = brl;
      return brl;
    }
  } catch (err) {
    console.error(err);
  }

  return 0;
}

async function ensureBrlPriceCached() {
  if (parseFiatPrice(AppState.cachedPrices, "BRL") > 0) {
    return AppState.cachedPrices.BRL;
  }

  return fetchBrlPrice();
}

async function fetchFiatPrice() {
  try {
    const prices = await fetchMempoolPrices();
    AppState.cachedPrices = { ...AppState.cachedPrices, ...prices };
  } catch (err) {
    console.error(err);
  }

  if (getDisplayCurrency() === "BRL") {
    await ensureBrlPriceCached();
  }

  return getFiatPrice();
}

window.fetchJson = fetchJson;
window.parseFiatPrice = parseFiatPrice;
window.getFiatPrice = getFiatPrice;
window.buildFiatText = buildFiatText;
window.fetchBrlPrice = fetchBrlPrice;
window.ensureBrlPriceCached = ensureBrlPriceCached;
window.fetchFiatPrice = fetchFiatPrice;