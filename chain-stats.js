const COINGECKO_MAYER_CHART_URL =
  "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=200&interval=daily";
const COINMETRICS_MVRV_URL =
  "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&page_size=1";
const BITCOIN_DATA_API = "https://bitcoin-data.com/api/v1";
const FEAR_GREED_API = "https://api.alternative.me/fng/?limit=1";
const BLOCKCHAIR_BITCOIN_STATS_URL = "https://api.blockchair.com/bitcoin/stats";
const MARKET_METRICS_REFRESH_MS = 60 * 60 * 1000;
const NON_ZERO_ADDRESSES_REFRESH_MS = 60 * 60 * 1000;
const MARKET_METRICS_CACHE_KEY = "bitcoinExplorer.marketMetrics";
let lastNonZeroAddressesFetchAt = 0;
const MAYER_CHEAP_MAX = 1;
const MAYER_NEUTRAL_MAX = 2.4;
const MVRV_CHEAP_MAX = 1;
const MVRV_NEUTRAL_MAX = 3.7;
const FEAR_GREED_NEUTRAL_MIN = 45;
const FEAR_GREED_NEUTRAL_MAX = 55;
const FEAR_GREED_CHEAP_LABELS = new Set(["Extreme Fear", "Fear"]);
const FEAR_GREED_EXPENSIVE_LABELS = new Set(["Greed", "Extreme Greed"]);

function loadCachedMarketMetrics() {
  try {
    const raw = localStorage.getItem(MARKET_METRICS_CACHE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > MARKET_METRICS_REFRESH_MS) return;

    AppState.cachedMarketMetrics = {
      ...AppState.cachedMarketMetrics,
      ...parsed.metrics,
    };
  } catch (err) {
    console.error(err);
  }
}

function saveCachedMarketMetrics() {
  try {
    localStorage.setItem(
      MARKET_METRICS_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        metrics: AppState.cachedMarketMetrics,
      }),
    );
  } catch (err) {
    console.error(err);
  }
}

async function computeMayerMultipleFromCoinGecko() {
  const data = await fetchJson(COINGECKO_MAYER_CHART_URL);
  const prices = Array.isArray(data?.prices) ? data.prices : [];
  const values = prices
    .map((point) => Number(point?.[1]))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (values.length === 0) return null;

  const sma = values.reduce((sum, price) => sum + price, 0) / values.length;
  const current = values[values.length - 1];

  if (!Number.isFinite(sma) || sma <= 0) return null;

  return current / sma;
}

async function fetchMvrvFromCoinMetrics() {
  const data = await fetchJson(COINMETRICS_MVRV_URL);
  const latest = Array.isArray(data?.data) ? data.data[0] : null;
  const value = Number(latest?.CapMVRVCur);

  if (!Number.isFinite(value) || value <= 0) return null;

  return value;
}

function formatTooltipBitcoinPrice() {
  const price = getFiatPrice();
  if (!price) return t("na");
  return formatFiat(price);
}

function formatFearGreedValue() {
  if (AppState.cachedMarketMetrics.fearGreed === null) return t("na");
  return String(AppState.cachedMarketMetrics.fearGreed);
}

function getMayerMultipleTone(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < MAYER_CHEAP_MAX) return "cheap";
  if (num <= MAYER_NEUTRAL_MAX) return "neutral";
  return "expensive";
}

function getMvrvTone(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < MVRV_CHEAP_MAX) return "cheap";
  if (num <= MVRV_NEUTRAL_MAX) return "neutral";
  return "expensive";
}

function getFearGreedTone() {
  const label = AppState.cachedMarketMetrics.fearGreedLabel;
  if (FEAR_GREED_CHEAP_LABELS.has(label)) return "cheap";
  if (label === "Neutral") return "neutral";
  if (FEAR_GREED_EXPENSIVE_LABELS.has(label)) return "expensive";

  const value = Number(AppState.cachedMarketMetrics.fearGreed);
  if (!Number.isFinite(value)) return null;
  if (value < FEAR_GREED_NEUTRAL_MIN) return "cheap";
  if (value <= FEAR_GREED_NEUTRAL_MAX) return "neutral";
  return "expensive";
}

function appendTooltipLine(parent, text) {
  const line = document.createElement("span");
  line.className = "top-nav__tooltip-line";
  line.textContent = text;
  parent.appendChild(line);
}

function appendTooltipMetricLine(parent, labelKey, valueText, tone) {
  const line = document.createElement("span");
  line.className = "top-nav__tooltip-line";

  const label = t(labelKey, { value: "" });
  line.appendChild(document.createTextNode(label));

  const valueEl = document.createElement("span");
  valueEl.className = "top-nav__tooltip-metric-value";
  if (tone) {
    valueEl.classList.add(`top-nav__tooltip-metric-value--${tone}`);
  }
  valueEl.textContent = valueText;
  line.appendChild(valueEl);
  parent.appendChild(line);
}

function updateNetworkTooltip() {
  if (!AppDom.networkTooltipEl || AppState.cachedBlockHeight === null) {
    return;
  }

  const blockHeight = Number(AppState.cachedBlockHeight);
  if (!Number.isFinite(blockHeight)) return;

  AppDom.networkTooltipEl.replaceChildren();

  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("blockHeight", { height: formatBlockHeight(blockHeight) }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("blocksToDifficulty", {
      blocks: formatBlockHeight(blocksUntilDifficultyAdjustment(blockHeight)),
    }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("blocksToHalving", {
      blocks: formatBlockHeight(blocksUntilHalving(blockHeight)),
    }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("totalSupply", { amount: formatTotalBtcSupply(blockHeight) }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("nonZeroAddresses", {
      count: formatNonZeroAddressCount(
        AppState.cachedMiningStats.nonZeroAddresses,
      ),
    }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("hashrate", { value: formatHashrate(AppState.cachedMiningStats.hashrate) }),
  );
  appendTooltipLine(
    AppDom.networkTooltipEl,
    t("networkDifficulty", {
      value: formatNetworkDifficulty(AppState.cachedMiningStats.difficulty),
    }),
  );

  AppDom.networkTooltipEl.hidden = false;
}

function formatNonZeroAddressCount(count) {
  if (count === null || count === undefined) return t("na");
  const value = Number(count);
  if (!Number.isFinite(value) || value < 0) return t("na");
  return formatBlockHeight(value);
}

function updateValuationTooltip() {
  if (!AppDom.valuationTooltipEl) {
    return;
  }

  AppDom.valuationTooltipEl.replaceChildren();

  appendTooltipMetricLine(
    AppDom.valuationTooltipEl,
    "mayerMultiple",
    formatMetric(AppState.cachedMarketMetrics.mayerMultiple),
    getMayerMultipleTone(AppState.cachedMarketMetrics.mayerMultiple),
  );
  appendTooltipMetricLine(
    AppDom.valuationTooltipEl,
    "mvrvRatio",
    formatMetric(AppState.cachedMarketMetrics.mvrv),
    getMvrvTone(AppState.cachedMarketMetrics.mvrv),
  );
  appendTooltipMetricLine(
    AppDom.valuationTooltipEl,
    "fearGreedIndex",
    formatFearGreedValue(),
    getFearGreedTone(),
  );
  appendTooltipLine(
    AppDom.valuationTooltipEl,
    t("bitcoinPrice", { value: formatTooltipBitcoinPrice() }),
  );

  AppDom.valuationTooltipEl.hidden = false;
}

function updateBlockHeightTooltip() {
  updateNetworkTooltip();
  updateValuationTooltip();
}

async function fetchMayerMultiple() {
  try {
    const data = await fetchJson(`${BITCOIN_DATA_API}/mayer-multiple/latest`);
    const value = Number(data?.mayerMultiple);
    if (Number.isFinite(value) && value > 0) {
      AppState.cachedMarketMetrics.mayerMultiple = value;
      return;
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const value = await computeMayerMultipleFromCoinGecko();
    if (Number.isFinite(value) && value > 0) {
      AppState.cachedMarketMetrics.mayerMultiple = value;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchMvrvRatio() {
  try {
    const data = await fetchJson(`${BITCOIN_DATA_API}/mvrv/latest`);
    const value = Number(data?.mvrv);
    if (Number.isFinite(value) && value > 0) {
      AppState.cachedMarketMetrics.mvrv = value;
      return;
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const value = await fetchMvrvFromCoinMetrics();
    if (Number.isFinite(value) && value > 0) {
      AppState.cachedMarketMetrics.mvrv = value;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchFearGreedIndex() {
  try {
    const data = await fetchJson(FEAR_GREED_API);
    const latest = Array.isArray(data?.data) ? data.data[0] : null;
    const value = Number(latest?.value);
    if (Number.isFinite(value)) {
      AppState.cachedMarketMetrics.fearGreed = value;
      AppState.cachedMarketMetrics.fearGreedLabel =
        latest?.value_classification ?? null;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchMarketMetrics() {
  await Promise.all([
    fetchMayerMultiple(),
    fetchMvrvRatio(),
    fetchFearGreedIndex(),
  ]);
  saveCachedMarketMetrics();
  updateBlockHeightTooltip();
}

function startMarketMetricsRefresh() {
  fetchMarketMetrics();

  if (AppState.marketMetricsInterval !== null) {
    clearInterval(AppState.marketMetricsInterval);
  }

  AppState.marketMetricsInterval = setInterval(
    fetchMarketMetrics,
    MARKET_METRICS_REFRESH_MS,
  );
}

async function fetchMiningStats() {
  try {
    const data = await fetchMempoolMiningStats();
    const hashrate = Number(data?.hashrate);
    const difficulty = Number(data?.difficulty);

    if (Number.isFinite(hashrate) && hashrate > 0) {
      AppState.cachedMiningStats.hashrate = hashrate;
    }

    if (Number.isFinite(difficulty) && difficulty > 0) {
      AppState.cachedMiningStats.difficulty = difficulty;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchNonZeroAddresses({ force = false } = {}) {
  const now = Date.now();
  if (
    !force &&
    lastNonZeroAddressesFetchAt > 0 &&
    now - lastNonZeroAddressesFetchAt < NON_ZERO_ADDRESSES_REFRESH_MS
  ) {
    return;
  }

  lastNonZeroAddressesFetchAt = now;

  try {
    const data = await fetchJson(BLOCKCHAIR_BITCOIN_STATS_URL);
    const count = Number(data?.data?.hodling_addresses);

    if (Number.isFinite(count) && count > 0) {
      AppState.cachedMiningStats.nonZeroAddresses = count;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchBlockHeight() {
  try {
    const [height] = await Promise.all([
      fetchMempoolText("/blocks/tip/height", {
        validate: (value) => /^\d+$/.test(value),
      }),
      fetchFiatPrice(),
      fetchMiningStats(),
      fetchNonZeroAddresses(),
    ]);

    AppState.cachedBlockHeight = height;
    updateBlockHeightTooltip();
    if (AppDom.txResultEl.classList.contains("show")) {
      updateTxConfirmationsDisplay();
    }
  } catch (err) {
    console.error(err);
  }
}

function startBlockHeightRefresh() {
  fetchBlockHeight();

  if (AppState.blockHeightInterval !== null) {
    clearInterval(AppState.blockHeightInterval);
  }

  AppState.blockHeightInterval = setInterval(
    fetchBlockHeight,
    AppConstants.UPDATE_INTERVAL_MS,
  );
}

window.loadCachedMarketMetrics = loadCachedMarketMetrics;
window.saveCachedMarketMetrics = saveCachedMarketMetrics;
window.updateBlockHeightTooltip = updateBlockHeightTooltip;
window.fetchMarketMetrics = fetchMarketMetrics;
window.startMarketMetricsRefresh = startMarketMetricsRefresh;
window.fetchMiningStats = fetchMiningStats;
window.fetchBlockHeight = fetchBlockHeight;
window.startBlockHeightRefresh = startBlockHeightRefresh;