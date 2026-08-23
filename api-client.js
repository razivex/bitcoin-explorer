const API_TIMEOUT_MS = 5000;
const WS_CONNECT_TIMEOUT_MS = 5000;

const MEMPOOL_API_PROVIDERS = [
  "https://mempool.space/api",
  "https://mempool.emzy.de/api",
  "https://mempool.haus/api",
  "https://mempool.jhoenicke.de/api",
  "https://mempool.ninja/api",
];

const ESPLORA_API_PROVIDERS = ["https://blockstream.info/api"];

const CHAIN_API_PROVIDERS = [
  ...MEMPOOL_API_PROVIDERS,
  ...ESPLORA_API_PROVIDERS,
];

const LIQUID_API_PROVIDERS = [
  "https://blockstream.info/liquid/api",
  "https://liquid.network/api",
];

const MEMPOOL_WS_PROVIDERS = [
  "wss://mempool.space/api/v1/ws",
  "wss://mempool.emzy.de/api/v1/ws",
  "wss://mempool.haus/api/v1/ws",
  "wss://mempool.jhoenicke.de/api/v1/ws",
  "wss://mempool.ninja/api/v1/ws",
];

const COINGECKO_USD_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
const BLOCKCHAIN_INFO_DIFFICULTY_URL =
  "https://blockchain.info/q/getdifficulty";
const BLOCKCHAIN_INFO_HASHRATE_URL = "https://blockchain.info/q/hashrate";

const LIVE_TICKER_SOURCES = {
  USD: [
    {
      name: "Binance",
      url: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      parse: (data) => Number(data?.price),
    },
    {
      name: "Binance Vision",
      url: "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT",
      parse: (data) => Number(data?.price),
    },
    {
      name: "Coinbase",
      url: "https://api.coinbase.com/v2/prices/BTC-USD/spot",
      parse: (data) => Number(data?.data?.amount),
    },
  ],
  BRL: [
    {
      name: "Binance",
      url: "https://api.binance.com/api/v3/ticker/price?symbol=BTCBRL",
      parse: (data) => Number(data?.price),
    },
    {
      name: "Binance Vision",
      url: "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCBRL",
      parse: (data) => Number(data?.price),
    },
    {
      name: "Coinbase",
      url: "https://api.coinbase.com/v2/prices/BTC-BRL/spot",
      parse: (data) => Number(data?.data?.amount),
    },
  ],
};

const lastGoodTickerIndex = {
  USD: -1,
  BRL: -1,
};
const TICKER_TIMEOUT_MS = 2500;

function isAbortError(err) {
  return err?.name === "AbortError";
}

function formatFetchError(err, label) {
  if (isAbortError(err)) {
    return new Error(`${label} timed out after ${API_TIMEOUT_MS}ms`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function tryProviders(providers, tryFn, label = "API") {
  let lastError = null;

  for (const provider of providers) {
    try {
      return await tryFn(provider);
    } catch (err) {
      lastError = formatFetchError(err, label);
      console.warn(`[api-client] ${provider} failed:`, lastError.message);
    }
  }

  throw lastError || new Error(`${label}: all providers failed`);
}

async function fetchFromProvider(
  base,
  path,
  { parse = "json", validate, timeoutMs } = {},
) {
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const response = await fetchWithTimeout(url, {}, timeoutMs);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data =
    parse === "json" ? await response.json() : (await response.text()).trim();

  if (validate && !validate(data)) {
    throw new Error("Invalid response");
  }

  return data;
}

async function fetchMempoolJson(path, options = {}) {
  const providers = options.providers || CHAIN_API_PROVIDERS;
  const { parse = "json", validate, timeoutMs } = options;

  return tryProviders(
    providers,
    (base) => fetchFromProvider(base, path, { parse, validate, timeoutMs }),
    "mempool API",
  );
}

async function fetchMempoolText(path, options = {}) {
  return fetchMempoolJson(path, { ...options, parse: "text" });
}

async function fetchMempoolOnlyJson(path, options = {}) {
  return fetchMempoolJson(path, {
    ...options,
    providers: MEMPOOL_API_PROVIDERS,
  });
}

async function fetchTickerFromSource(source) {
  const data = await fetchFromProvider("", source.url, {
    timeoutMs: TICKER_TIMEOUT_MS,
    validate: (payload) => {
      const value = Number(source.parse(payload));
      return Number.isFinite(value) && value > 0;
    },
  });
  return Number(source.parse(data));
}

async function raceTickerSources(code, sources) {
  const errors = [];

  return new Promise((resolve, reject) => {
    let pending = sources.length;
    let settled = false;

    if (pending === 0) {
      reject(new Error(`No live ticker sources for ${code}`));
      return;
    }

    sources.forEach((source, index) => {
      fetchTickerFromSource(source)
        .then((value) => {
          if (settled) return;
          settled = true;
          lastGoodTickerIndex[code] = index;
          resolve(value);
        })
        .catch((err) => {
          const wrapped = formatFetchError(
            err,
            `${source.name} ${code} ticker`,
          );
          errors.push(wrapped);
          console.warn(
            `[api-client] ${source.name} ${code} ticker failed:`,
            wrapped.message,
          );
          pending -= 1;
          if (!settled && pending === 0) {
            reject(
              errors[errors.length - 1] ||
                new Error(`${code} ticker: all providers failed`),
            );
          }
        });
    });
  });
}

async function fetchExchangeTickerPrice(currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  const sources = LIVE_TICKER_SOURCES[code];
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(`No live ticker sources for ${code}`);
  }

  const preferredIndex = lastGoodTickerIndex[code];
  const preferred =
    preferredIndex >= 0 && preferredIndex < sources.length
      ? sources[preferredIndex]
      : null;

  if (preferred) {
    try {
      return await fetchTickerFromSource(preferred);
    } catch (err) {
      const wrapped = formatFetchError(
        err,
        `${preferred.name} ${code} ticker`,
      );
      console.warn(
        `[api-client] ${preferred.name} ${code} ticker failed:`,
        wrapped.message,
      );
      lastGoodTickerIndex[code] = -1;
    }
  }

  return raceTickerSources(code, sources);
}

async function fetchMempoolPrices() {
  try {
    return await fetchMempoolOnlyJson("/v1/prices", {
      validate: (data) =>
        data &&
        typeof data === "object" &&
        Number(data.USD ?? data.usd) > 0,
    });
  } catch (primaryErr) {
    console.warn(
      "[api-client] mempool price providers failed, trying CoinGecko:",
      primaryErr.message,
    );
  }

  const data = await fetchFromProvider("", COINGECKO_USD_PRICE_URL, {
    validate: (payload) => Number(payload?.bitcoin?.usd) > 0,
  });
  const usd = Number(data.bitcoin.usd);
  return { USD: usd };
}

async function fetchMempoolMiningStats() {
  try {
    const data = await fetchMempoolOnlyJson("/v1/mining/hashrate/3d", {
      validate: (payload) =>
        Number(payload?.currentHashrate) > 0 ||
        Number(payload?.currentDifficulty) > 0,
    });

    return {
      hashrate: Number(data.currentHashrate),
      difficulty: Number(data.currentDifficulty),
    };
  } catch (primaryErr) {
    console.warn(
      "[api-client] mempool mining providers failed, trying blockchain.info:",
      primaryErr.message,
    );
  }

  const [difficultyResponse, hashrateResponse] = await Promise.all([
    fetchWithTimeout(BLOCKCHAIN_INFO_DIFFICULTY_URL),
    fetchWithTimeout(BLOCKCHAIN_INFO_HASHRATE_URL),
  ]);

  if (!difficultyResponse.ok || !hashrateResponse.ok) {
    throw new Error("blockchain.info mining fallback failed");
  }

  const difficultyText = (await difficultyResponse.text()).trim();
  const hashrateGhText = (await hashrateResponse.text()).trim();
  const difficulty = Number(difficultyText);
  const hashrateGh = Number(hashrateGhText);

  if (!Number.isFinite(difficulty) || difficulty <= 0) {
    throw new Error("Invalid difficulty fallback response");
  }

  const result = { difficulty, hashrate: null };
  if (Number.isFinite(hashrateGh) && hashrateGh > 0) {
    result.hashrate = hashrateGh * 1e9;
  }

  return result;
}

async function fetchMempoolRecommendedFees() {
  return fetchMempoolOnlyJson("/v1/fees/recommended", {
    validate: (payload) =>
      payload &&
      typeof payload === "object" &&
      Number(payload.fastestFee) > 0,
  });
}

async function fetchMempoolTransactionTimes(txid) {
  const encodedTxid = encodeURIComponent(txid);
  return fetchMempoolOnlyJson(
    `/v1/transaction-times?txId[]=${encodedTxid}`,
    {
      validate: (data) => Array.isArray(data),
    },
  );
}

async function fetchMempoolBlockAudit(blockHash, txid) {
  const encodedBlockHash = encodeURIComponent(blockHash);
  const encodedTxid = encodeURIComponent(txid);
  return fetchMempoolOnlyJson(
    `/v1/block/${encodedBlockHash}/tx/${encodedTxid}/audit`,
  );
}

async function fetchMempoolRecent() {
  return fetchMempoolOnlyJson("/mempool/recent", {
    validate: (data) => Array.isArray(data),
  });
}

async function fetchMempoolInfo() {
  return fetchMempoolJson("/mempool", {
    validate: (data) =>
      data &&
      typeof data === "object" &&
      Number.isFinite(Number(data.count)) &&
      Number(data.count) >= 0,
  });
}

async function fetchLiquidJson(path, options = {}) {
  const providers = options.providers || LIQUID_API_PROVIDERS;
  const { parse = "json", validate, timeoutMs } = options;

  return tryProviders(
    providers,
    (base) => fetchFromProvider(base, path, { parse, validate, timeoutMs }),
    "Liquid API",
  );
}

async function fetchLiquidText(path, options = {}) {
  return fetchLiquidJson(path, { ...options, parse: "text" });
}

async function fetchLiquidTipHeight() {
  const heightText = await fetchLiquidText("/blocks/tip/height", {
    validate: (text) => Number.isFinite(Number(text)) && Number(text) >= 0,
  });
  return Number(heightText);
}

function getMempoolWsProviders() {
  return MEMPOOL_WS_PROVIDERS;
}

window.API_TIMEOUT_MS = API_TIMEOUT_MS;
window.WS_CONNECT_TIMEOUT_MS = WS_CONNECT_TIMEOUT_MS;
window.MEMPOOL_API_PROVIDERS = MEMPOOL_API_PROVIDERS;
window.LIQUID_API_PROVIDERS = LIQUID_API_PROVIDERS;
window.fetchWithTimeout = fetchWithTimeout;
window.fetchMempoolJson = fetchMempoolJson;
window.fetchMempoolText = fetchMempoolText;
window.fetchMempoolOnlyJson = fetchMempoolOnlyJson;
window.fetchLiquidJson = fetchLiquidJson;
window.fetchLiquidText = fetchLiquidText;
window.fetchLiquidTipHeight = fetchLiquidTipHeight;
window.fetchExchangeTickerPrice = fetchExchangeTickerPrice;
window.fetchMempoolPrices = fetchMempoolPrices;
window.fetchMempoolMiningStats = fetchMempoolMiningStats;
window.fetchMempoolRecommendedFees = fetchMempoolRecommendedFees;
window.fetchMempoolTransactionTimes = fetchMempoolTransactionTimes;
window.fetchMempoolBlockAudit = fetchMempoolBlockAudit;
window.fetchMempoolRecent = fetchMempoolRecent;
window.fetchMempoolInfo = fetchMempoolInfo;
window.getMempoolWsProviders = getMempoolWsProviders;