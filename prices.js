const COINGECKO_BRL_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl";

let pricePollInFlight = false;
let pricePollEventsBound = false;

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
  if (!price) return "";
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

function isValuationViewVisible() {
  return Boolean(AppDom.valuationViewEl && !AppDom.valuationViewEl.hidden);
}

function isAddressFiatVisible() {
  if (AppDom.checkViewEl?.hidden) return false;
  if (!AppDom.resultEl?.classList.contains("show")) return false;

  const data = AppState.lastAppliedData;
  if (!data || data.balanceConfidential || data.confirmedBtc === null) {
    return false;
  }

  return Number(data.confirmedBtc) > 0;
}

function isPriceVisible() {
  if (document.hidden) return false;
  return isValuationViewVisible() || isAddressFiatVisible();
}

function applyLivePriceToVisibleUi() {
  if (
    isValuationViewVisible() &&
    typeof updateValuationStats === "function"
  ) {
    updateValuationStats();
  }

  if (!isAddressFiatVisible()) return;

  const data = AppState.lastAppliedData;
  if (!data) return;

  if (data.unconfirmedConfidential) {
    const fiatText = buildFiatText(data.confirmedBtc);
    if (!fiatText) return;
    AppState.balanceSubState.usdText = fiatText;
    if (AppState.balanceSubState.showingUsd) {
      renderBalanceSubLine(fiatText);
    }
    return;
  }

  if (typeof updateBalanceSubSilently === "function") {
    updateBalanceSubSilently(
      data.confirmedBtc,
      data.unconfirmedSats ?? 0,
      data.unconfirmedBtc ?? 0,
      getFiatPrice(),
      data.addressData?.mempool_stats,
    );
  }
}

async function fetchFiatPrice() {
  const currency = getDisplayCurrency();

  try {
    const value = await fetchExchangeTickerPrice(currency);
    if (Number.isFinite(value) && value > 0) {
      AppState.cachedPrices[currency] = value;
      return value;
    }
  } catch (err) {
    console.warn(
      "[prices] live ticker failed, trying fallback:",
      err?.message || err,
    );
  }

  try {
    if (currency === "BRL") {
      await fetchBrlPrice();
    } else {
      const prices = await fetchMempoolPrices();
      AppState.cachedPrices = { ...AppState.cachedPrices, ...prices };
    }
  } catch (err) {
    console.error(err);
  }

  return getFiatPrice();
}

async function pollFiatPrice() {
  if (pricePollInFlight) return;
  if (!isPriceVisible()) {
    stopLivePricePolling();
    return;
  }

  pricePollInFlight = true;
  try {
    const price = await fetchFiatPrice();
    if (price > 0 && isPriceVisible()) {
      applyLivePriceToVisibleUi();
    }
  } finally {
    pricePollInFlight = false;
  }
}

function startLivePricePolling() {
  if (AppState.pricePollInterval !== null) return;

  void pollFiatPrice();
  AppState.pricePollInterval = setInterval(
    pollFiatPrice,
    AppConstants.PRICE_POLL_MS,
  );
}

function stopLivePricePolling() {
  if (AppState.pricePollInterval === null) return;
  clearInterval(AppState.pricePollInterval);
  AppState.pricePollInterval = null;
}

function syncLivePricePolling({ immediate = false } = {}) {
  if (!isPriceVisible()) {
    stopLivePricePolling();
    return;
  }

  if (AppState.pricePollInterval === null) {
    startLivePricePolling();
    return;
  }

  if (immediate) {
    void pollFiatPrice();
  }
}

function bindPricePollingEvents() {
  if (pricePollEventsBound) return;
  pricePollEventsBound = true;

  document.addEventListener("visibilitychange", () => {
    syncLivePricePolling();
  });
}

window.fetchJson = fetchJson;
window.parseFiatPrice = parseFiatPrice;
window.getFiatPrice = getFiatPrice;
window.buildFiatText = buildFiatText;
window.fetchBrlPrice = fetchBrlPrice;
window.ensureBrlPriceCached = ensureBrlPriceCached;
window.fetchFiatPrice = fetchFiatPrice;
window.isPriceVisible = isPriceVisible;
window.syncLivePricePolling = syncLivePricePolling;
window.bindPricePollingEvents = bindPricePollingEvents;
window.applyLivePriceToVisibleUi = applyLivePriceToVisibleUi;
