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
const metaTransactionsEl = document.getElementById("metaTransactions");
const metaConfirmationsEl = document.getElementById("metaConfirmations");
const metaConfirmationDateEl = document.getElementById("metaConfirmationDate");
const timeSinceEl = document.getElementById("timeSince");

let timeSinceInterval = null;
let balanceSubInterval = null;
let autoRefreshInterval = null;
let refreshInFlight = false;
let lookupGeneration = 0;
let currentLookupInput = null;
let lastConfirmedTimestamp = null;
let cachedUsdPrice = 0;
let balanceSubState = {
  hasUnconfirmed: false,
  showingUsd: true,
  usdText: "",
  unconfirmedText: "",
};

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
  if (timeSinceInterval !== null) {
    clearInterval(timeSinceInterval);
    timeSinceInterval = null;
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

function formatUsd(value) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function setBalanceSubText(text, animate = true) {
  if (!animate) {
    balanceUnconfirmedEl.textContent = text;
    balanceUnconfirmedEl.classList.remove("is-fading");
    return;
  }

  balanceUnconfirmedEl.classList.add("is-fading");

  setTimeout(() => {
    balanceUnconfirmedEl.textContent = text;
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
  };

  balanceUnconfirmedEl.textContent = usdText;
  balanceUnconfirmedEl.classList.remove("is-fading");

  balanceSubInterval = setInterval(() => {
    balanceSubState.showingUsd = !balanceSubState.showingUsd;
    setBalanceSubText(
      balanceSubState.showingUsd
        ? balanceSubState.usdText
        : balanceSubState.unconfirmedText,
    );
  }, UPDATE_INTERVAL_MS);
}

function setupBalanceSub(totalBtc, unconfirmedSats, unconfirmedBtc, usdPrice) {
  stopBalanceSubCycle();

  const usdText = `≈ ${formatUsd(totalBtc * usdPrice)} USD`;
  balanceSubState.usdText = usdText;

  if (unconfirmedSats > 0) {
    const unconfirmedText = `${formatBtc(unconfirmedBtc)} BTC unconfirmed`;
    startBalanceSubCycle(usdText, unconfirmedText);
    return;
  }

  balanceSubState = {
    hasUnconfirmed: false,
    showingUsd: true,
    usdText,
    unconfirmedText: "",
  };
  balanceUnconfirmedEl.textContent = usdText;
  balanceUnconfirmedEl.classList.remove("is-fading");
}

function updateBalanceSubSilently(
  totalBtc,
  unconfirmedSats,
  unconfirmedBtc,
  usdPrice,
) {
  const usdText = `≈ ${formatUsd(totalBtc * usdPrice)} USD`;
  const hasUnconfirmed = unconfirmedSats > 0;
  const unconfirmedText = hasUnconfirmed
    ? `${formatBtc(unconfirmedBtc)} BTC unconfirmed`
    : "";

  if (hasUnconfirmed !== balanceSubState.hasUnconfirmed) {
    setupBalanceSub(totalBtc, unconfirmedSats, unconfirmedBtc, usdPrice);
    return;
  }

  balanceSubState.usdText = usdText;
  balanceSubState.unconfirmedText = unconfirmedText;

  if (!hasUnconfirmed) {
    balanceUnconfirmedEl.textContent = usdText;
    return;
  }

  const visibleText = balanceSubState.showingUsd
    ? balanceSubState.usdText
    : balanceSubState.unconfirmedText;
  setBalanceSubText(visibleText, false);
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
    showError("QR code library failed to load. Refresh the page and try again.");
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
    showError("Could not generate QR code. Please try again.");
  }
}

function satsToBtc(sats) {
  return sats / SATS_PER_BTC;
}

function formatBtc(btc) {
  return btc.toLocaleString(undefined, {
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

function parseUsdPrice(prices) {
  if (!prices || typeof prices !== "object") return 0;

  const raw = prices.USD ?? prices.usd;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

async function fetchUsdPrice() {
  try {
    const prices = await fetchJson(`${API_BASE}/v1/prices`);
    const price = parseUsdPrice(prices);
    if (price > 0) {
      cachedUsdPrice = price;
      return price;
    }
  } catch (err) {
    console.error(err);
  }

  return cachedUsdPrice;
}

function getAddressType(address, { isPublicKey = false } = {}) {
  const normalized = address.trim();
  if (!normalized) return "Unknown";

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
  return "Unknown";
}

function pad2(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function formatDateTime(date) {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${pad2(hours)}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} ${ampm}`;
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
    ["year", parts.years],
    ["month", parts.months],
    ["day", parts.days],
    ["hour", parts.hours],
    ["minute", parts.minutes],
    ["second", parts.seconds],
  ];

  const tierStart = units.findIndex(([, value]) => value > 0);
  if (tierStart === -1) return "0 seconds";

  const formatUnit = ([label, value]) =>
    `${value} ${label}${value === 1 ? "" : "s"}`;

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
    timeSinceEl.textContent = formatTimeSince(getTimeSinceParts(fromDate));
  };

  tick();
  timeSinceInterval = setInterval(tick, 1000);
}

function calcConfirmations(tx, tipHeight) {
  if (!tx?.status?.confirmed || !tx.status.block_height) {
    return 0;
  }
  return tipHeight - tx.status.block_height + 1;
}

function getLastTxTimestamp(tx) {
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

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return response.text();
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

  const [chainTxs, tipHeightText, usdPrice] = await Promise.all([
    fetchJson(`${API_BASE}/${apiBasePath}/${encodedQueryKey}/txs/chain`).catch(
      () => [],
    ),
    fetchText(`${API_BASE}/blocks/tip/height`).catch(() => "0"),
    fetchUsdPrice(),
  ]);

  const tipHeight = Number.parseInt(tipHeightText, 10) || 0;
  const confirmedSats = calcBalance(addressData.chain_stats);
  const unconfirmedSats = calcBalance(addressData.mempool_stats);
  const totalSats = confirmedSats + unconfirmedSats;
  const totalBtc = satsToBtc(totalSats);
  const unconfirmedBtc = satsToBtc(unconfirmedSats);
  const lastConfirmedTx = Array.isArray(chainTxs) ? chainTxs[0] : null;

  let lastTxConfirmations = "N/A";
  let lastTxDate = "N/A";
  let lastTxDateObj = null;

  if (lastConfirmedTx) {
    lastTxConfirmations = String(
      calcConfirmations(lastConfirmedTx, tipHeight),
    );
    lastTxDateObj = getLastTxTimestamp(lastConfirmedTx);
    if (lastTxDateObj) {
      lastTxDate = formatDateTime(lastTxDateObj);
    }
  }

  return {
    addressData,
    lookupMode: lookupTarget.mode,
    totalBtc,
    unconfirmedSats,
    unconfirmedBtc,
    usdPrice,
    addressType: getAddressType(addressData.address, {
      isPublicKey: isPublicKeyLookup,
    }),
    txCount: addressData.chain_stats.tx_count ?? 0,
    lastTxConfirmations,
    lastTxDate,
    lastTxDateObj,
  };
}

function applyAddressData(data, { silent = false } = {}) {
  balanceBtcEl.textContent = `${formatBtc(data.totalBtc)} BTC`;

  if (silent) {
    updateBalanceSubSilently(
      data.totalBtc,
      data.unconfirmedSats,
      data.unconfirmedBtc,
      data.usdPrice,
    );
  } else {
    setupBalanceSub(
      data.totalBtc,
      data.unconfirmedSats,
      data.unconfirmedBtc,
      data.usdPrice,
    );
  }

  metaAddressLabelEl.textContent =
    data.lookupMode === "pubkey" ? "Public Key:" : "Address:";
  metaAddressEl.textContent = data.addressData.address;
  metaAddressTypeEl.textContent = data.addressType;
  metaTransactionsEl.textContent = data.txCount;
  metaConfirmationsEl.textContent = data.lastTxConfirmations;
  metaConfirmationDateEl.textContent = data.lastTxDate;

  const nextTimestamp = data.lastTxDateObj?.getTime() ?? null;
  if (data.lastTxDateObj) {
    if (nextTimestamp !== lastConfirmedTimestamp) {
      lastConfirmedTimestamp = nextTimestamp;
      startTimeSinceTimer(data.lastTxDateObj);
    }
  } else {
    lastConfirmedTimestamp = null;
    stopTimeSinceTimer();
    timeSinceEl.textContent = "N/A";
  }

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
  lastConfirmedTimestamp = null;

  const address = addressInput.value.trim();
  if (!address) {
    showError("Please enter a Bitcoin address or public key.");
    return;
  }

  lookupBtn.disabled = true;
  lookupBtn.textContent = "Loading...";

  try {
    const data = await loadAddressData(address);
    if (generation !== lookupGeneration) return;

    applyAddressData(data, { silent: false });
    startAutoRefresh();
  } catch (err) {
    if (generation === lookupGeneration) {
      const message =
        err?.message === "Invalid public key hex"
          ? "Invalid public key. Paste a compressed (02/03...) or uncompressed (04...) key in hex."
          : "Could not fetch balance. Check the address or public key and try again.";
      showError(message);
    }
    console.error(err);
  } finally {
    if (generation === lookupGeneration) {
      lookupBtn.disabled = false;
      lookupBtn.textContent = "Check";
    }
  }
}

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