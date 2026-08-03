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

// Odometer timing: longer base, scales with steps so big rolls stay readable.
const STAT_DIGIT_HEIGHT_EM = 1.2;
const STAT_REEL_MIDDLE_BASE = 10; // index of digit 0 in the middle 0–9 copy
const STAT_DIGIT_MIN_MS = 950;
const STAT_DIGIT_PER_STEP_MS = 110;
const STAT_DIGIT_MAX_MS = 1700;
const STAT_DIGIT_STAGGER_MS = 45;
const STAT_TICK_MS = STAT_DIGIT_MAX_MS + STAT_DIGIT_STAGGER_MS * 6;
const statTickTimers = new WeakMap();
const statDigitAnimTimers = new WeakMap();

function applyStatTone(el, tone) {
  el.classList.remove(
    "stat-card__value--cheap",
    "stat-card__value--neutral",
    "stat-card__value--expensive",
  );
  if (tone) {
    el.classList.add(`stat-card__value--${tone}`);
  }
}

function flashStatDirection(el, direction) {
  el.classList.remove("stat-card__value--tick-up", "stat-card__value--tick-down");
  if (direction === 0) return;

  // Restart CSS animation if the same direction fires again.
  void el.offsetWidth;
  el.classList.add(
    direction > 0 ? "stat-card__value--tick-up" : "stat-card__value--tick-down",
  );

  const prevTimer = statTickTimers.get(el);
  if (prevTimer) clearTimeout(prevTimer);

  const timer = setTimeout(() => {
    el.classList.remove(
      "stat-card__value--tick-up",
      "stat-card__value--tick-down",
    );
    statTickTimers.delete(el);
  }, STAT_TICK_MS + 80);
  statTickTimers.set(el, timer);
}

function ensureStatOdometer(el) {
  let root = el.querySelector(":scope > .stat-odometer");
  if (root) return root;

  el.textContent = "";
  root = document.createElement("span");
  root.className = "stat-odometer";
  el.appendChild(root);
  return root;
}

function createStatDigit() {
  const digit = document.createElement("span");
  digit.className = "stat-odometer__digit";
  digit.setAttribute("aria-hidden", "true");

  const reel = document.createElement("span");
  reel.className = "stat-odometer__reel";

  // Three copies of 0–9 so digits can roll forward/backward past 9↔0
  // without whipping the full strip in reverse.
  for (let copy = 0; copy < 3; copy += 1) {
    for (let d = 0; d <= 9; d += 1) {
      const num = document.createElement("span");
      num.className = "stat-odometer__num";
      num.textContent = String(d);
      reel.appendChild(num);
    }
  }

  digit.appendChild(reel);
  return digit;
}

function snapStatDigitReel(reel, index) {
  reel.style.transition = "none";
  reel.style.transform = `translateY(${-index * STAT_DIGIT_HEIGHT_EM}em)`;
  // Force reflow so later animated updates still transition.
  void reel.offsetWidth;
  reel.style.transition = "";
}

function setStatDigit(
  digitEl,
  nextDigit,
  { instant = false, direction = 0, delayMs = 0 } = {},
) {
  const reel = digitEl.querySelector(".stat-odometer__reel");
  if (!reel) return;

  const digit = Number(nextDigit);
  if (!Number.isFinite(digit)) return;

  const prevRaw = digitEl.dataset.digit;
  const prevDigit = prevRaw !== undefined ? Number(prevRaw) : NaN;
  const middleIndex = STAT_REEL_MIDDLE_BASE + digit;

  const prevAnim = statDigitAnimTimers.get(digitEl);
  if (prevAnim) {
    clearTimeout(prevAnim);
    statDigitAnimTimers.delete(digitEl);
  }

  // Snap when first paint, forced instant, same digit, or no overall direction.
  if (
    instant ||
    direction === 0 ||
    !Number.isFinite(prevDigit) ||
    prevDigit === digit
  ) {
    snapStatDigitReel(reel, middleIndex);
    digitEl.dataset.digit = String(digit);
    return;
  }

  // Roll in the value's direction (wrap 9→0 forward on increases, etc.).
  const steps =
    direction > 0
      ? (digit - prevDigit + 10) % 10
      : (prevDigit - digit + 10) % 10;

  if (steps === 0) {
    snapStatDigitReel(reel, middleIndex);
    digitEl.dataset.digit = String(digit);
    return;
  }

  const startIndex = STAT_REEL_MIDDLE_BASE + prevDigit;
  const endIndex =
    direction > 0 ? startIndex + steps : startIndex - steps;

  // Longer rolls take more time so the reel doesn't blur past.
  const durationMs = Math.min(
    STAT_DIGIT_MAX_MS,
    STAT_DIGIT_MIN_MS + (steps - 1) * STAT_DIGIT_PER_STEP_MS,
  );

  snapStatDigitReel(reel, startIndex);
  reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`;
  reel.style.transform = `translateY(${-endIndex * STAT_DIGIT_HEIGHT_EM}em)`;
  digitEl.dataset.digit = String(digit);

  // After the roll settles, recenter on the middle copy for the next tick.
  const token = `${digit}:${endIndex}:${durationMs}:${delayMs}`;
  digitEl.dataset.animToken = token;
  const timer = setTimeout(() => {
    statDigitAnimTimers.delete(digitEl);
    if (digitEl.dataset.animToken !== token) return;
    if (digitEl.dataset.digit !== String(digit)) return;
    snapStatDigitReel(reel, middleIndex);
  }, durationMs + delayMs + 40);
  statDigitAnimTimers.set(digitEl, timer);
}

function renderStatOdometer(el, text, { instant = false, direction = 0 } = {}) {
  const root = ensureStatOdometer(el);
  const chars = Array.from(text);
  const nodes = [...root.children];

  while (nodes.length > chars.length) {
    const node = nodes.pop();
    node?.remove();
  }

  const digitIndexes = [];
  chars.forEach((ch, index) => {
    if (ch >= "0" && ch <= "9") digitIndexes.push(index);
  });

  chars.forEach((ch, index) => {
    const isDigit = ch >= "0" && ch <= "9";
    let node = root.children[index] || null;

    if (isDigit) {
      if (!node || !node.classList.contains("stat-odometer__digit")) {
        const digit = createStatDigit();
        if (node) {
          root.replaceChild(digit, node);
        } else {
          root.appendChild(digit);
        }
        node = digit;
        setStatDigit(node, ch, { instant: true });
        return;
      }

      const prevDigit = node.dataset.digit;
      const shouldSnap =
        instant || prevDigit === undefined || prevDigit === ch;
      const orderFromRight =
        digitIndexes.length - 1 - digitIndexes.indexOf(index);
      const delayMs = shouldSnap ? 0 : orderFromRight * STAT_DIGIT_STAGGER_MS;
      setStatDigit(node, ch, {
        instant: shouldSnap,
        direction: shouldSnap ? 0 : direction,
        delayMs,
      });
      return;
    }

    if (!node || !node.classList.contains("stat-odometer__symbol")) {
      const symbol = document.createElement("span");
      symbol.className = "stat-odometer__symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = ch;
      if (node) {
        root.replaceChild(symbol, node);
      } else {
        root.appendChild(symbol);
      }
      return;
    }

    if (node.textContent !== ch) {
      node.textContent = ch;
    }
  });

  // Accessible plain text for screen readers.
  el.setAttribute("aria-label", text);
}

/**
 * Update a value with a Google/Robinhood-style digit scroll when the number
 * moves up or down (network/valuation stats, address balances, etc.).
 *
 * @param {HTMLElement | null} el
 * @param {{
 *   text: string,
 *   value?: number | null,
 *   tone?: string | null,
 *   instant?: boolean,
 * }} options
 */
function setStatValue(
  el,
  { text, value = null, tone = null, instant: forceInstant = false } = {},
) {
  if (!el) return;

  const nextText = text == null || text === "" ? t("na") : String(text);
  const nextNum =
    value === null || value === undefined || value === ""
      ? NaN
      : Number(value);
  const prevRaw = el.dataset.statValue;
  const prevNum =
    prevRaw !== undefined && prevRaw !== "" ? Number(prevRaw) : NaN;
  const prevText = el.dataset.displayText;
  const isFirst = prevText === undefined;
  const valueUnchanged =
    Number.isFinite(prevNum) && Number.isFinite(nextNum) && prevNum === nextNum;

  applyStatTone(el, tone);

  if (prevText === nextText) {
    if (Number.isFinite(nextNum)) {
      el.dataset.statValue = String(nextNum);
    } else {
      delete el.dataset.statValue;
    }
    return;
  }

  let direction = 0;
  if (Number.isFinite(prevNum) && Number.isFinite(nextNum)) {
    direction = Math.sign(nextNum - prevNum);
  }

  const instant =
    forceInstant ||
    isFirst ||
    !Number.isFinite(nextNum) ||
    !Number.isFinite(prevNum) ||
    valueUnchanged ||
    direction === 0;

  renderStatOdometer(el, nextText, {
    instant,
    direction: instant ? 0 : direction,
  });

  if (!instant && direction !== 0) {
    flashStatDirection(el, direction);
  }

  el.dataset.displayText = nextText;
  if (Number.isFinite(nextNum)) {
    el.dataset.statValue = String(nextNum);
  } else {
    delete el.dataset.statValue;
  }
}

/** Clear odometer state so the next update is treated as a first paint. */
function resetStatOdometer(el) {
  if (!el) return;
  const prevTimer = statTickTimers.get(el);
  if (prevTimer) {
    clearTimeout(prevTimer);
    statTickTimers.delete(el);
  }
  el.classList.remove(
    "stat-card__value--cheap",
    "stat-card__value--neutral",
    "stat-card__value--expensive",
    "stat-card__value--tick-up",
    "stat-card__value--tick-down",
  );
  delete el.dataset.statValue;
  delete el.dataset.displayText;
  el.removeAttribute("aria-label");
  el.textContent = "";
}

function formatNonZeroAddressCount(count) {
  if (count === null || count === undefined) return t("na");
  const value = Number(count);
  if (!Number.isFinite(value) || value < 0) return t("na");
  return formatBlockHeight(value);
}

function isFiniteStatValue(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

const loadingStatEls = new Set();
let statsLoadingTimer = null;
let statsLoadingDotPhase = 0;

function formatStatsLoadingText() {
  // Animate "Loading" → "Loading." → "Loading.." → "Loading..."
  const raw = t("loading");
  const base = raw.replace(/\.+$/u, "").replace(/…$/u, "").trim() || "Loading";
  const dots = ".".repeat(statsLoadingDotPhase % 4);
  return `${base}${dots}`;
}

function stopStatsLoadingAnimation() {
  if (statsLoadingTimer !== null) {
    clearInterval(statsLoadingTimer);
    statsLoadingTimer = null;
  }
}

function tickStatsLoadingAnimation() {
  statsLoadingDotPhase = (statsLoadingDotPhase + 1) % 4;
  const text = formatStatsLoadingText();
  for (const el of loadingStatEls) {
    el.textContent = text;
    el.setAttribute("aria-label", text);
    el.dataset.displayText = text;
  }
}

function startStatsLoadingAnimation() {
  if (statsLoadingTimer !== null) return;
  statsLoadingTimer = setInterval(tickStatsLoadingAnimation, 420);
}

function setStatLoading(el) {
  if (!el) return;

  const wasLoading = el.dataset.statLoading === "1";
  el.dataset.statLoading = "1";
  delete el.dataset.statValue;
  el.classList.remove(
    "stat-card__value--cheap",
    "stat-card__value--neutral",
    "stat-card__value--expensive",
    "stat-card__value--tick-up",
    "stat-card__value--tick-down",
  );
  el.classList.add("stat-card__value--loading");

  // Drop odometer markup while loading so the label can animate freely.
  el.textContent = formatStatsLoadingText();
  el.setAttribute("aria-label", el.textContent);
  el.dataset.displayText = el.textContent;

  loadingStatEls.add(el);
  startStatsLoadingAnimation();

  if (!wasLoading) {
    // Keep phases in sync when a new card joins mid-cycle.
    el.textContent = formatStatsLoadingText();
  }
}

function clearStatLoading(el) {
  if (!el || el.dataset.statLoading !== "1") return;
  delete el.dataset.statLoading;
  el.classList.remove("stat-card__value--loading");
  loadingStatEls.delete(el);
  if (loadingStatEls.size === 0) {
    stopStatsLoadingAnimation();
  }
  // Next setStatValue should treat this as a first paint (no fake tick).
  delete el.dataset.displayText;
  delete el.dataset.statValue;
  el.textContent = "";
}

/**
 * Show an animated Loading… state until a finite value is available.
 * @param {HTMLElement | null} el
 * @param {{
 *   ready: boolean,
 *   text?: string,
 *   value?: number | null,
 *   tone?: string | null,
 *   instant?: boolean,
 * }} options
 */
function setStatValueOrLoading(el, { ready, text, value = null, tone = null, instant = false } = {}) {
  if (!el) return;

  if (!ready) {
    setStatLoading(el);
    return;
  }

  clearStatLoading(el);
  setStatValue(el, { text, value, tone, instant });
}

function updateNetworkStats() {
  const blockHeight = Number(AppState.cachedBlockHeight);
  const hasHeight = Number.isFinite(blockHeight);

  const blocksToDiff = hasHeight
    ? blocksUntilDifficultyAdjustment(blockHeight)
    : null;
  const blocksToHalvingValue = hasHeight ? blocksUntilHalving(blockHeight) : null;
  const supplyBtc = hasHeight ? totalBtcSupplyFromHeight(blockHeight) : null;
  const nonZero = AppState.cachedMiningStats.nonZeroAddresses;
  const hashrate = AppState.cachedMiningStats.hashrate;
  const difficulty = AppState.cachedMiningStats.difficulty;

  setStatValueOrLoading(AppDom.statBlockHeightEl, {
    ready: hasHeight,
    text: hasHeight ? formatBlockHeight(blockHeight) : "",
    value: hasHeight ? blockHeight : null,
  });
  setStatValueOrLoading(AppDom.statHashrateEl, {
    ready: isFiniteStatValue(hashrate) && Number(hashrate) > 0,
    text: isFiniteStatValue(hashrate) ? formatHashrate(hashrate) : "",
    value: isFiniteStatValue(hashrate) ? Number(hashrate) : null,
  });
  setStatValueOrLoading(AppDom.statDifficultyEl, {
    ready: isFiniteStatValue(difficulty) && Number(difficulty) > 0,
    text: isFiniteStatValue(difficulty)
      ? formatNetworkDifficulty(difficulty)
      : "",
    value: isFiniteStatValue(difficulty) ? Number(difficulty) : null,
  });
  setStatValueOrLoading(AppDom.statBlocksToHalvingEl, {
    ready: blocksToHalvingValue != null,
    text:
      blocksToHalvingValue != null
        ? formatBlockHeight(blocksToHalvingValue)
        : "",
    value: blocksToHalvingValue,
  });
  setStatValueOrLoading(AppDom.statBlocksToDifficultyEl, {
    ready: blocksToDiff != null,
    text: blocksToDiff != null ? formatBlockHeight(blocksToDiff) : "",
    value: blocksToDiff,
  });
  setStatValueOrLoading(AppDom.statTotalSupplyEl, {
    ready: supplyBtc != null,
    text:
      supplyBtc != null ? `${formatTotalBtcSupply(blockHeight)} BTC` : "",
    value: supplyBtc,
  });
  setStatValueOrLoading(AppDom.statNonZeroAddressesEl, {
    ready: isFiniteStatValue(nonZero) && Number(nonZero) > 0,
    text: isFiniteStatValue(nonZero) ? formatNonZeroAddressCount(nonZero) : "",
    value: isFiniteStatValue(nonZero) ? Number(nonZero) : null,
  });
}

function updateValuationStats() {
  const mayer = AppState.cachedMarketMetrics.mayerMultiple;
  const mvrv = AppState.cachedMarketMetrics.mvrv;
  const fearGreed = AppState.cachedMarketMetrics.fearGreed;
  const price = getFiatPrice();
  const hasMayer = isFiniteStatValue(mayer) && Number(mayer) > 0;
  const hasMvrv = isFiniteStatValue(mvrv) && Number(mvrv) > 0;
  const hasFearGreed = isFiniteStatValue(fearGreed);
  const hasPrice = isFiniteStatValue(price) && Number(price) > 0;

  setStatValueOrLoading(AppDom.statBitcoinPriceEl, {
    ready: hasPrice,
    text: hasPrice ? formatFiat(price) : "",
    value: hasPrice ? Number(price) : null,
  });
  setStatValueOrLoading(AppDom.statMayerMultipleEl, {
    ready: hasMayer,
    text: hasMayer ? formatMetric(mayer) : "",
    value: hasMayer ? Number(mayer) : null,
    tone: hasMayer ? getMayerMultipleTone(mayer) : null,
  });
  setStatValueOrLoading(AppDom.statMvrvEl, {
    ready: hasMvrv,
    text: hasMvrv ? formatMetric(mvrv) : "",
    value: hasMvrv ? Number(mvrv) : null,
    tone: hasMvrv ? getMvrvTone(mvrv) : null,
  });
  setStatValueOrLoading(AppDom.statFearGreedEl, {
    ready: hasFearGreed,
    text: hasFearGreed ? formatFearGreedValue() : "",
    value: hasFearGreed ? Number(fearGreed) : null,
    tone: hasFearGreed ? getFearGreedTone() : null,
  });
}

function updateBlockHeightTooltip() {
  updateNetworkStats();
  updateValuationStats();
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
window.setStatValue = setStatValue;
window.resetStatOdometer = resetStatOdometer;