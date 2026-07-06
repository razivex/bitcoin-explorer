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

function getMempoolWsProviders() {
  return MEMPOOL_WS_PROVIDERS;
}

window.API_TIMEOUT_MS = API_TIMEOUT_MS;
window.WS_CONNECT_TIMEOUT_MS = WS_CONNECT_TIMEOUT_MS;
window.MEMPOOL_API_PROVIDERS = MEMPOOL_API_PROVIDERS;
window.fetchWithTimeout = fetchWithTimeout;
window.fetchMempoolJson = fetchMempoolJson;
window.fetchMempoolText = fetchMempoolText;
window.fetchMempoolOnlyJson = fetchMempoolOnlyJson;
window.fetchMempoolPrices = fetchMempoolPrices;
window.fetchMempoolMiningStats = fetchMempoolMiningStats;
window.fetchMempoolTransactionTimes = fetchMempoolTransactionTimes;
window.fetchMempoolBlockAudit = fetchMempoolBlockAudit;
window.fetchMempoolRecent = fetchMempoolRecent;
window.getMempoolWsProviders = getMempoolWsProviders;