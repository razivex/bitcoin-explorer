const API_BASE = "https://mempool.space/api";
const SATS_PER_BTC = 100_000_000;
const UPDATE_INTERVAL_MS = 10000;
const BALANCE_SUB_FADE_MS = 600;
const addressInput = document.getElementById("address");
const lookupBtn = document.getElementById("lookupBtn");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");
const balanceBtcEl = document.getElementById("balanceBtc");
const balanceUnconfirmedEl = document.getElementById("balanceUnconfirmed");
const qrBtn = document.getElementById("qrBtn");
const qrOverlay = document.getElementById("qrOverlay");
const qrCanvas = document.getElementById("qrCanvas");
const cardEl = document.querySelector(".card");
const metaAddressLabelEl = document.getElementById("metaAddressLabel");
const metaAddressEl = document.getElementById("metaAddress");
const metaAddressTypeEl = document.getElementById("metaAddressType");
const metaExposedPubKeyEl = document.getElementById("metaExposedPubKey");
const metaTransactionsEl = document.getElementById("metaTransactions");
const metaLastTxDateEl = document.getElementById("metaLastTxDate");
const timeSinceLastEl = document.getElementById("timeSinceLast");
const blockHeightTooltipEl = document.getElementById("blockHeightTooltip");

let timeSinceLastInterval = null;
let balanceSubInterval = null;
let autoRefreshInterval = null;
let refreshInFlight = false;
let lookupGeneration = 0;
let currentLookupInput = null;
let lastTxTimestamp = null;
let cachedPrices = {};
let balanceSubState = {
  hasUnconfirmed: false,
  showingUsd: true,
  usdText: "",
  unconfirmedText: "",
  arrowUp: false,
  arrowDown: false,
};
let txWatchState = {
  initialized: false,
  chainTxCount: 0,
  mempoolTxCount: 0,
  lastConfirmedTxId: null,
};
let lastAppliedData = null;
let cachedBlockHeight = null;
let blockHeightInterval = null;

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add("show");
  resultEl.classList.remove("show");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.remove("show");
}

function stopTimeSinceTimer() {
  if (timeSinceLastInterval !== null) {
    clearInterval(timeSinceLastInterval);
    timeSinceLastInterval = null;
  }
}

function stopBalanceSubCycle() {
  if (balanceSubInterval !== null) {
    clearInterval(balanceSubInterval);
    balanceSubInterval = null;
  }
}

function stopAutoRefresh() {
  if (autoRefreshInterval !== null) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

function resetTxWatchState() {
  txWatchState = {
    initialized: false,
    chainTxCount: 0,
    mempoolTxCount: 0,
    lastConfirmedTxId: null,
  };
}

function detectAndPlayTxSounds(data, { silent = false } = {}) {
  const chainTxCount = data.txCount;
  const mempoolTxCount = data.mempoolTxCount;
  const lastConfirmedTxId = data.lastConfirmedTxId;

  if (!silent || !txWatchState.initialized) {
    txWatchState = {
      initialized: true,
      chainTxCount,
      mempoolTxCount,
      lastConfirmedTxId,
    };
    return;
  }

  const newConfirmed =
    chainTxCount > txWatchState.chainTxCount ||
    (lastConfirmedTxId &&
      lastConfirmedTxId !== txWatchState.lastConfirmedTxId);
  const newUnconfirmed = mempoolTxCount > txWatchState.mempoolTxCount;

  if (newConfirmed) {
    playConfirmedSound();
  } else if (newUnconfirmed) {
    playBellSound();
  }

  txWatchState = {
    initialized: true,
    chainTxCount,
    mempoolTxCount,
    lastConfirmedTxId,
  };
}

function formatFiat(value) {
  return value.toLocaleString(getLocale(), {
    style: "currency",
    currency: getDisplayCurrency(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildFiatText(confirmedBtc) {
  const price = getFiatPrice();
  const currency = getDisplayCurrency();
  return `≈ ${formatFiat(confirmedBtc * price)} ${currency}`;
}

function getUnconfirmedArrowState(mempoolStats) {
  const funded = Number(mempoolStats?.funded_txo_sum) || 0;
  const spent = Number(mempoolStats?.spent_txo_sum) || 0;

  return {
    up: funded > 0,
    down: spent > 0,
  };
}

function hasUnconfirmedActivity(unconfirmedSats, mempoolStats) {
  if (unconfirmedSats !== 0) return true;

  const funded = Number(mempoolStats?.funded_txo_sum) || 0;
  const spent = Number(mempoolStats?.spent_txo_sum) || 0;
  return funded > 0 || spent > 0;
}

function formatUnconfirmedText(unconfirmedSats, unconfirmedBtc) {
  const absAmount = formatBtc(Math.abs(unconfirmedBtc));
  const signedAmount = unconfirmedSats < 0 ? `-${absAmount}` : absAmount;
  return t("btcUnconfirmed", { amount: signedAmount });
}

function renderBalanceSubLine(text, { showArrows = false } = {}) {
  balanceUnconfirmedEl.replaceChildren();

  if (
    showArrows &&
    (balanceSubState.arrowUp || balanceSubState.arrowDown)
  ) {
    const arrows = document.createElement("span");
    arrows.className = "balance-unconfirmed__arrows";
    arrows.setAttribute("aria-hidden", "true");

    if (balanceSubState.arrowUp) {
      const upArrow = document.createElement("span");
      upArrow.className = "balance-arrow balance-arrow--up";
      upArrow.textContent = "▲";
      arrows.appendChild(upArrow);
    }

    if (balanceSubState.arrowDown) {
      const downArrow = document.createElement("span");
      downArrow.className = "balance-arrow balance-arrow--down";
      downArrow.textContent = "▼";
      arrows.appendChild(downArrow);
    }

    balanceUnconfirmedEl.appendChild(arrows);
  }

  const textSpan = document.createElement("span");
  textSpan.className = "balance-unconfirmed__text";
  textSpan.textContent = text;
  balanceUnconfirmedEl.appendChild(textSpan);
}

function setBalanceSubText(text, animate = true, { showArrows = false } = {}) {
  if (!animate) {
    renderBalanceSubLine(text, { showArrows });
    balanceUnconfirmedEl.classList.remove("is-fading");
    return;
  }

  balanceUnconfirmedEl.classList.add("is-fading");

  setTimeout(() => {
    renderBalanceSubLine(text, { showArrows });
    balanceUnconfirmedEl.classList.remove("is-fading");
  }, BALANCE_SUB_FADE_MS);
}

function startBalanceSubCycle(usdText, unconfirmedText) {
  stopBalanceSubCycle();

  balanceSubState = {
    hasUnconfirmed: true,
    showingUsd: true,
    usdText,
    unconfirmedText,
    arrowUp: balanceSubState.arrowUp,
    arrowDown: balanceSubState.arrowDown,
  };

  renderBalanceSubLine(usdText);
  balanceUnconfirmedEl.classList.remove("is-fading");

  balanceSubInterval = setInterval(() => {
    balanceSubState.showingUsd = !balanceSubState.showingUsd;
    const showingUnconfirmed = !balanceSubState.showingUsd;
    setBalanceSubText(
      showingUnconfirmed
        ? balanceSubState.unconfirmedText
        : balanceSubState.usdText,
      true,
      { showArrows: showingUnconfirmed },
    );
  }, UPDATE_INTERVAL_MS);
}

function setupBalanceSub(
  confirmedBtc,
  unconfirmedSats,
  unconfirmedBtc,
  fiatPrice,
  mempoolStats,
) {
  stopBalanceSubCycle();

  const fiatText = buildFiatText(confirmedBtc);
  balanceSubState.usdText = fiatText;

  if (hasUnconfirmedActivity(unconfirmedSats, mempoolStats)) {
    const unconfirmedText = formatUnconfirmedText(
      unconfirmedSats,
      unconfirmedBtc,
    );
    startBalanceSubCycle(fiatText, unconfirmedText);
    return;
  }

  balanceSubState = {
    hasUnconfirmed: false,
    showingUsd: true,
    usdText: fiatText,
    unconfirmedText: "",
    arrowUp: false,
    arrowDown: false,
  };
  renderBalanceSubLine(fiatText);
  balanceUnconfirmedEl.classList.remove("is-fading");
}

function updateBalanceSubSilently(
  confirmedBtc,
  unconfirmedSats,
  unconfirmedBtc,
  fiatPrice,
  mempoolStats,
) {
  const fiatText = buildFiatText(confirmedBtc);
  const hasUnconfirmed = hasUnconfirmedActivity(unconfirmedSats, mempoolStats);
  const unconfirmedText = hasUnconfirmed
    ? formatUnconfirmedText(unconfirmedSats, unconfirmedBtc)
    : "";

  if (hasUnconfirmed !== balanceSubState.hasUnconfirmed) {
    setupBalanceSub(
      confirmedBtc,
      unconfirmedSats,
      unconfirmedBtc,
      fiatPrice,
      mempoolStats,
    );
    return;
  }

  balanceSubState.usdText = fiatText;
  balanceSubState.unconfirmedText = unconfirmedText;

  if (!hasUnconfirmed) {
    renderBalanceSubLine(fiatText);
    return;
  }

  const showingUnconfirmed = !balanceSubState.showingUsd;
  const visibleText = showingUnconfirmed
    ? balanceSubState.unconfirmedText
    : balanceSubState.usdText;
  setBalanceSubText(visibleText, false, { showArrows: showingUnconfirmed });
}

function getQrSize() {
  const styles = getComputedStyle(cardEl);
  const horizontalPadding =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const modalPadding = 40;
  const cardContentWidth = cardEl.clientWidth - horizontalPadding - modalPadding;

  return Math.floor(Math.min(cardContentWidth, window.innerWidth - 96));
}

function hideQrPanel() {
  qrOverlay.hidden = true;
}

async function showQrCode() {
  if (!currentLookupInput || !qrOverlay.hidden) return;

  if (typeof QRCode === "undefined") {
    showError(t("errorQrLibrary"));
    return;
  }

  try {
    const qrSize = getQrSize();
    await QRCode.toCanvas(qrCanvas, currentLookupInput, {
      width: qrSize,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    qrOverlay.hidden = false;
  } catch (err) {
    console.error(err);
    showError(t("errorQrGenerate"));
  }
}

function satsToBtc(sats) {
  return sats / SATS_PER_BTC;
}

function formatBtc(btc) {
  return btc.toLocaleString(getLocale(), {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function calcBalance(stats) {
  if (!stats) return 0;

  const funded = Number(stats.funded_txo_sum) || 0;
  const spent = Number(stats.spent_txo_sum) || 0;
  return funded - spent;
}

function isValidAddressData(addressData) {
  return Boolean(
    addressData?.chain_stats &&
      Number.isFinite(Number(addressData.chain_stats.funded_txo_sum)) &&
      Number.isFinite(Number(addressData.chain_stats.spent_txo_sum)),
  );
}

function parseFiatPrice(prices, currency = getDisplayCurrency()) {
  if (!prices || typeof prices !== "object") return 0;

  const raw = prices[currency] ?? prices[currency.toLowerCase()];
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getFiatPrice() {
  return parseFiatPrice(cachedPrices);
}

async function fetchFiatPrice() {
  try {
    const prices = await fetchJson(`${API_BASE}/v1/prices`);
    cachedPrices = prices;
    const price = parseFiatPrice(prices);
    if (price > 0) {
      return price;
    }
  } catch (err) {
    console.error(err);
  }

  return getFiatPrice();
}

function hasSpentOutputs(stats) {
  if (!stats) return false;

  const spentCount = Number(stats.spent_txo_count) || 0;
  const spentSum = Number(stats.spent_txo_sum) || 0;
  return spentCount > 0 || spentSum > 0;
}

function isPublicKeyExposed(lookupMode, addressData) {
  if (lookupMode === "pubkey") {
    return true;
  }

  return (
    hasSpentOutputs(addressData.chain_stats) ||
    hasSpentOutputs(addressData.mempool_stats)
  );
}

function formatExposedPubKey(exposed) {
  return exposed ? t("yes") : t("no");
}

function getAddressType(address, { isPublicKey = false } = {}) {
  const normalized = address.trim();
  if (!normalized) return t("unknown");

  if (isPublicKey || isHexPublicKey(normalized)) {
    return "P2PK";
  }

  const lower = normalized.toLowerCase();
  if (lower.startsWith("bc1p")) return "P2TR";
  if (lower.startsWith("bc1q")) {
    if (normalized.length === 42) return "P2WPKH";
    if (normalized.length === 62) return "P2WSH";
    return "Bech32";
  }
  if (normalized.startsWith("1")) return "P2PKH";
  if (normalized.startsWith("3")) return "P2SH";
  return t("unknown");
}

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function formatDateTime(date) {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());

  if (getCurrentLang() === "pt-BR") {
    return `${day}/${month}/${year} ${pad2(date.getHours())}:${minutes}:${seconds}`;
  }

  let hours = date.getHours();
  const ampm = hours >= 12 ? t("pm") : t("am");
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${pad2(hours)}:${minutes}:${seconds} ${ampm}`;
}

function getTimeSinceParts(fromDate, toDate = new Date()) {
  let years = toDate.getFullYear() - fromDate.getFullYear();
  let months = toDate.getMonth() - fromDate.getMonth();
  let days = toDate.getDate() - fromDate.getDate();
  let hours = toDate.getHours() - fromDate.getHours();
  let minutes = toDate.getMinutes() - fromDate.getMinutes();
  let seconds = toDate.getSeconds() - fromDate.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const previousMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days, hours, minutes, seconds };
}

function formatTimeSince(parts) {
  const units = [
    ["unitYear", "unitYears", parts.years],
    ["unitMonth", "unitMonths", parts.months],
    ["unitDay", "unitDays", parts.days],
    ["unitHour", "unitHours", parts.hours],
    ["unitMinute", "unitMinutes", parts.minutes],
    ["unitSecond", "unitSeconds", parts.seconds],
  ];

  const tierStart = units.findIndex(([, , value]) => value > 0);
  if (tierStart === -1) return t("zeroSeconds");

  const formatUnit = ([singular, plural, value]) =>
    `${value} ${value === 1 ? t(singular) : t(plural)}`;

  if (tierStart >= units.length - 1) {
    return formatUnit(units[tierStart]);
  }

  return units
    .slice(tierStart, tierStart + 2)
    .map(formatUnit)
    .join(" ");
}

function startTimeSinceTimer(fromDate) {
  stopTimeSinceTimer();

  if (!fromDate) return;

  const tick = () => {
    timeSinceLastEl.textContent = formatTimeSince(getTimeSinceParts(fromDate));
  };

  tick();
  timeSinceLastInterval = setInterval(tick, 1000);
}

function getTxTimestamp(tx) {
  const blockTime = tx?.status?.block_time;
  if (!blockTime) return null;
  return new Date(blockTime * 1000);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return response.json();
}

async function loadAddressData(address) {
  let lookupTarget;
  try {
    lookupTarget = await resolveLookupTarget(address);
  } catch (err) {
    if (isHexPublicKey(address)) {
      throw new Error("Invalid public key hex");
    }
    throw err;
  }

  const encodedQueryKey = encodeURIComponent(lookupTarget.queryKey);
  const isPublicKeyLookup = lookupTarget.mode === "pubkey";
  const apiBasePath = isPublicKeyLookup ? "scripthash" : "address";

  const rawData = await fetchJson(
    `${API_BASE}/${apiBasePath}/${encodedQueryKey}`,
  );

  const addressData = isPublicKeyLookup
    ? {
        ...rawData,
        address: lookupTarget.displayValue,
        is_pubkey: true,
      }
    : rawData;

  if (!isValidAddressData(addressData)) {
    throw new Error("Invalid address response");
  }

  const txCount = addressData.chain_stats.tx_count ?? 0;
  const mempoolTxCount = addressData.mempool_stats?.tx_count ?? 0;

  const [chainTxs, fiatPrice] = await Promise.all([
    fetchJson(`${API_BASE}/${apiBasePath}/${encodedQueryKey}/txs/chain`).catch(
      () => [],
    ),
    fetchFiatPrice(),
  ]);

  const confirmedSats = calcBalance(addressData.chain_stats);
  const unconfirmedSats = calcBalance(addressData.mempool_stats);
  const confirmedBtc = satsToBtc(confirmedSats);
  const unconfirmedBtc = satsToBtc(unconfirmedSats);
  const lastConfirmedTx = Array.isArray(chainTxs) ? chainTxs[0] : null;

  let lastTxDate = t("na");
  let lastTxDateObj = null;

  if (lastConfirmedTx) {
    lastTxDateObj = getTxTimestamp(lastConfirmedTx);
    if (lastTxDateObj) {
      lastTxDate = formatDateTime(lastTxDateObj);
    }
  }

  return {
    addressData,
    lookupMode: lookupTarget.mode,
    confirmedBtc,
    unconfirmedSats,
    unconfirmedBtc,
    fiatPrice,
    addressType: getAddressType(addressData.address, {
      isPublicKey: isPublicKeyLookup,
    }),
    exposedPubKey: isPublicKeyExposed(lookupTarget.mode, addressData),
    txCount,
    mempoolTxCount,
    lastConfirmedTxId: lastConfirmedTx?.txid ?? null,
    lastTxDate,
    lastTxDateObj,
  };
}

function applyAddressData(data, { silent = false } = {}) {
  balanceBtcEl.textContent = `${formatBtc(data.confirmedBtc)} BTC`;

  const arrows = getUnconfirmedArrowState(data.addressData.mempool_stats);
  balanceSubState.arrowUp = arrows.up;
  balanceSubState.arrowDown = arrows.down;

  if (silent) {
    updateBalanceSubSilently(
      data.confirmedBtc,
      data.unconfirmedSats,
      data.unconfirmedBtc,
      data.fiatPrice,
      data.addressData.mempool_stats,
    );
  } else {
    setupBalanceSub(
      data.confirmedBtc,
      data.unconfirmedSats,
      data.unconfirmedBtc,
      data.fiatPrice,
      data.addressData.mempool_stats,
    );
  }

  metaAddressLabelEl.textContent =
    data.lookupMode === "pubkey" ? t("publicKey") : t("address");
  metaAddressEl.textContent = data.addressData.address;
  metaAddressTypeEl.textContent = getAddressType(data.addressData.address, {
    isPublicKey: data.lookupMode === "pubkey",
  });
  metaExposedPubKeyEl.textContent = formatExposedPubKey(data.exposedPubKey);
  metaTransactionsEl.textContent = data.txCount;
  metaLastTxDateEl.textContent = data.lastTxDateObj
    ? formatDateTime(data.lastTxDateObj)
    : t("na");

  const nextLastTimestamp = data.lastTxDateObj?.getTime() ?? null;
  if (data.lastTxDateObj) {
    if (nextLastTimestamp !== lastTxTimestamp) {
      lastTxTimestamp = nextLastTimestamp;
      startTimeSinceTimer(data.lastTxDateObj);
    }
  } else {
    lastTxTimestamp = null;
    stopTimeSinceTimer();
    timeSinceLastEl.textContent = t("na");
  }

  detectAndPlayTxSounds(data, { silent });

  lastAppliedData = data;
  currentLookupInput = data.addressData.address;
  resultEl.classList.add("show");
}

async function refreshAddressSilently() {
  if (!currentLookupInput || refreshInFlight) return;

  const targetInput = currentLookupInput;
  const generation = lookupGeneration;
  refreshInFlight = true;

  try {
    const data = await loadAddressData(targetInput);
    if (
      generation !== lookupGeneration ||
      targetInput !== currentLookupInput ||
      data.addressData.address !== targetInput
    ) {
      return;
    }

    applyAddressData(data, { silent: true });
  } catch (err) {
    console.error(err);
  } finally {
    refreshInFlight = false;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshInterval = setInterval(refreshAddressSilently, UPDATE_INTERVAL_MS);
}

async function lookupAddress() {
  const generation = ++lookupGeneration;

  clearError();
  stopTimeSinceTimer();
  stopBalanceSubCycle();
  stopAutoRefresh();
  hideQrPanel();
  currentLookupInput = null;
  lastTxTimestamp = null;
  lastAppliedData = null;
  resetTxWatchState();

  const address = addressInput.value.trim();
  if (!address) {
    showError(t("errorEmpty"));
    return;
  }

  lookupBtn.disabled = true;
  lookupBtn.textContent = t("loading");

  try {
    const data = await loadAddressData(address);
    if (generation !== lookupGeneration) return;

    applyAddressData(data, { silent: false });
    startAutoRefresh();
  } catch (err) {
    if (generation === lookupGeneration) {
      const message =
        err?.message === "Invalid public key hex"
          ? t("errorInvalidPubkey")
          : t("errorFetch");
      showError(message);
    }
    console.error(err);
  } finally {
    if (generation === lookupGeneration) {
      lookupBtn.disabled = false;
      lookupBtn.textContent = t("check");
    }
  }
}

function formatBlockHeight(height) {
  const value = Number(height);
  if (!Number.isFinite(value)) return height;
  return value.toLocaleString(getLocale());
}

function updateBlockHeightTooltip() {
  if (!blockHeightTooltipEl || cachedBlockHeight === null) return;

  blockHeightTooltipEl.textContent = t("blockHeight", {
    height: formatBlockHeight(cachedBlockHeight),
  });
  blockHeightTooltipEl.hidden = false;
}

async function fetchBlockHeight() {
  try {
    const response = await fetch(`${API_BASE}/blocks/tip/height`);
    if (!response.ok) {
      throw new Error(`API error (${response.status})`);
    }

    const height = (await response.text()).trim();
    if (!/^\d+$/.test(height)) {
      throw new Error("Invalid block height response");
    }

    cachedBlockHeight = height;
    updateBlockHeightTooltip();
  } catch (err) {
    console.error(err);
  }
}

function startBlockHeightRefresh() {
  fetchBlockHeight();

  if (blockHeightInterval !== null) {
    clearInterval(blockHeightInterval);
  }

  blockHeightInterval = setInterval(fetchBlockHeight, UPDATE_INTERVAL_MS);
}

startBlockHeightRefresh();

lookupBtn.addEventListener("click", lookupAddress);
qrBtn.addEventListener("click", showQrCode);
qrOverlay.addEventListener("click", (event) => {
  if (event.target === qrOverlay) {
    hideQrPanel();
  }
});
addressInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") lookupAddress();
});

onLanguageChange(() => {
  if (lookupBtn.disabled) {
    lookupBtn.textContent = t("loading");
  }

  updateBlockHeightTooltip();

  if (lastAppliedData && resultEl.classList.contains("show")) {
    applyAddressData(lastAppliedData, { silent: true });
  }
});