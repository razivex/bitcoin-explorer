const RECENT_POLL_MS = 2500;
const WS_RECONNECT_MS = 4000;
const MAX_CONCURRENT_BLOCKS = 36;
const SEEN_TXID_LIMIT = 5000;

const FEE_LEVELS = [
  0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 125,
  150, 175, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400,
  1600, 1800, 2000,
];

const MEMPOOL_FEE_COLORS = [
  "007d3d", "557d00", "5d7d01", "637d02", "6d7d04", "757d05", "7d7d06", "867d08",
  "8c7d09", "957d0b", "9b7d0c", "a67d0e", "aa7d0f", "b27d10", "bb7d11", "bf7d12",
  "bf7815", "bf7319", "be6c1e", "be6820", "bd6125", "bd5c28", "bc552d", "bc4f30",
  "bc4a34", "bb4339", "bb3d3c", "bb373f", "ba3243", "b92b48", "b9254b", "b8214d",
  "b71d4f", "b61951", "b41453", "b30e55", "b10857", "b00259", "ae005b",
];

let mempoolSocket = null;
let wsProviderIndex = 0;
let wsConnectTimer = null;
let reconnectTimer = null;
let recentPollTimer = null;
let spawnLoopTimer = null;
let recentPollInitialized = false;
let watchedLookup = null;
const seenTxids = new Set();
const blockQueue = [];
let activeBlocks = 0;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function rememberTxid(txid) {
  seenTxids.add(txid);
  if (seenTxids.size <= SEEN_TXID_LIMIT) return;

  const trimmed = [...seenTxids].slice(-Math.floor(SEEN_TXID_LIMIT * 0.8));
  seenTxids.clear();
  trimmed.forEach((id) => seenTxids.add(id));
}

function getFeeRateFromTx(tx) {
  const fee = Number(tx?.fee);
  const vsize = Number(tx?.vsize);
  if (!Number.isFinite(fee) || !Number.isFinite(vsize) || vsize <= 0) return null;
  return fee / vsize;
}

function getFeeColorLevel(rate) {
  const index = FEE_LEVELS.findIndex((feeLvl) => Math.max(0, rate) < feeLvl) - 1;
  if (index < 0) return MEMPOOL_FEE_COLORS.length - 1;
  return Math.min(index, MEMPOOL_FEE_COLORS.length - 1);
}

function getFeeColorHex(rate) {
  if (rate === null || !Number.isFinite(rate)) {
    return MEMPOOL_FEE_COLORS[0];
  }

  return MEMPOOL_FEE_COLORS[getFeeColorLevel(rate)];
}

function hexToRgb(hex) {
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function applyFeeColorStyles(block, hex) {
  const base = hexToRgb(hex);
  const light = {
    r: Math.min(255, base.r + 8),
    g: Math.min(255, base.g + 23),
    b: Math.min(255, base.b + 25),
  };
  const dark = {
    r: Math.round(base.r * 0.745),
    g: Math.round(base.g * 0.721),
    b: Math.round(base.b * 0.692),
  };
  const border = {
    r: Math.min(255, base.r + 8),
    g: Math.min(255, base.g + 39),
    b: Math.min(255, base.b + 66),
  };

  block.style.setProperty("--fee-light", `rgb(${light.r}, ${light.g}, ${light.b})`);
  block.style.setProperty("--fee-base", `rgb(${base.r}, ${base.g}, ${base.b})`);
  block.style.setProperty("--fee-dark", `rgb(${dark.r}, ${dark.g}, ${dark.b})`);
  block.style.setProperty(
    "--fee-border",
    `rgba(${border.r}, ${border.g}, ${border.b}, 0.7)`,
  );
  block.style.setProperty(
    "--fee-glow",
    `rgba(${base.r}, ${base.g}, ${base.b}, 0.35)`,
  );
}

function getSpawnDelayMs() {
  const backlog = blockQueue.length;

  if (backlog > 120) {
    return 70 + Math.random() * 50;
  }

  if (backlog > 40) {
    return 110 + Math.random() * 70;
  }

  return 160 + Math.random() * 180;
}

function enqueueBlockEntries(entries) {
  if (!entries.length) return;

  for (const entry of entries) {
    blockQueue.push(entry);
  }

  ensureSpawnLoop();
}

function enqueueBlocks(count, variant = "default", feeRate = null) {
  if (count <= 0) return;

  enqueueBlockEntries(
    Array.from({ length: count }, () => ({ variant, feeRate })),
  );
}

function ensureSpawnLoop() {
  if (spawnLoopTimer !== null) return;
  scheduleSpawnTick(0);
}

function scheduleSpawnTick(delayMs) {
  spawnLoopTimer = window.setTimeout(() => {
    spawnLoopTimer = null;

    if (prefersReducedMotion()) {
      blockQueue.length = 0;
      return;
    }

    const container = document.getElementById("fallingBlocks");

    if (
      container &&
      blockQueue.length > 0 &&
      activeBlocks < MAX_CONCURRENT_BLOCKS
    ) {
      const item = blockQueue.shift();
      activeBlocks += 1;
      createFallingBlock(container, item, () => {
        activeBlocks -= 1;
      });
    }

    if (blockQueue.length > 0 || activeBlocks > 0) {
      scheduleSpawnTick(getSpawnDelayMs());
    }
  }, delayMs);
}

function notifyNewMempoolTxs(txs, variant = "default") {
  const entries = [];

  for (const tx of txs) {
    const txid = typeof tx === "string" ? tx : tx?.txid;
    if (!txid || seenTxids.has(txid)) continue;

    rememberTxid(txid);
    entries.push({
      variant,
      feeRate: typeof tx === "object" ? getFeeRateFromTx(tx) : null,
    });
  }

  enqueueBlockEntries(entries);
}

function getTxAddresses(tx) {
  const addresses = new Set();

  for (const vout of tx?.vout || []) {
    if (vout.scriptpubkey_address) {
      addresses.add(vout.scriptpubkey_address.toLowerCase());
    }
  }

  for (const vin of tx?.vin || []) {
    if (vin.prevout?.scriptpubkey_address) {
      addresses.add(vin.prevout.scriptpubkey_address.toLowerCase());
    }
  }

  return addresses;
}

function transactionTouchesWatch(tx) {
  if (!watchedLookup || !tx || typeof tx !== "object") return false;

  if (watchedLookup.mode === "pubkey" && watchedLookup.scriptPubKey) {
    const script = watchedLookup.scriptPubKey.toLowerCase();

    for (const vout of tx.vout || []) {
      if (vout.scriptpubkey?.toLowerCase() === script) return true;
    }

    for (const vin of tx.vin || []) {
      if (vin.prevout?.scriptpubkey?.toLowerCase() === script) return true;
    }

    return false;
  }

  const watchedAddress = watchedLookup.displayValue?.toLowerCase();
  if (!watchedAddress) return false;

  return getTxAddresses(tx).has(watchedAddress);
}

function createFallingBlock(container, item, onComplete) {
  const variant = item?.variant || "default";
  const block = document.createElement("div");
  block.className = "falling-block";
  if (variant === "address") {
    block.classList.add("falling-block--address");
  } else {
    applyFeeColorStyles(block, getFeeColorHex(item?.feeRate));
  }
  block.setAttribute("aria-hidden", "true");

  const size = 8 + Math.random() * 10;
  const left = 3 + Math.random() * 94;
  const durationMs = 1800 + Math.random() * 4200;
  const delayMs = Math.random() * 420;
  const rotation = (Math.random() - 0.5) * 80;
  const endRotation = rotation + (Math.random() > 0.5 ? 220 : -220);

  block.style.setProperty("--block-size", `${size.toFixed(1)}px`);
  block.style.left = `${left.toFixed(2)}%`;
  block.style.width = `${size.toFixed(1)}px`;
  block.style.height = `${size.toFixed(1)}px`;

  container.appendChild(block);

  const finish = () => {
    block.remove();
    onComplete?.();
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }

  const fallDistance = window.innerHeight + 120;
  const animation = block.animate(
    [
      {
        transform: `translate3d(0, 0, 0) rotate(${rotation.toFixed(1)}deg)`,
        opacity: 0,
      },
      { opacity: 0.82, offset: 0.1 },
      {
        transform: `translate3d(0, ${fallDistance}px, 0) rotate(${endRotation.toFixed(1)}deg)`,
        opacity: 0.28,
      },
    ],
    {
      duration: durationMs,
      delay: delayMs,
      easing: "linear",
      fill: "forwards",
    },
  );

  if (!animation) {
    finish();
    return;
  }

  animation.onfinish = finish;
  animation.oncancel = finish;
}

function spawnFallingBlocks(count = 1) {
  const sampleRates = [0.5, 2, 8, 20, 50, 120, 300, 800, 1500];
  enqueueBlockEntries(
    Array.from({ length: count }, (_, index) => ({
      variant: "default",
      feeRate: sampleRates[index % sampleRates.length],
    })),
  );
}

function spawnAddressBlocks(count = 1) {
  enqueueBlocks(count, "address");
}

function setWatchedLookup(target) {
  if (!target?.displayValue) {
    watchedLookup = null;
  } else {
    watchedLookup = {
      mode: target.mode || "address",
      displayValue: target.displayValue,
      queryKey: target.queryKey || target.displayValue,
      scriptPubKey: target.scriptPubKey || null,
    };
  }

  sendWatchSubscription();
}

function clearWatchedLookup() {
  setWatchedLookup(null);
}

function sendWatchSubscription() {
  if (!mempoolSocket || mempoolSocket.readyState !== WebSocket.OPEN) return;

  if (!watchedLookup) {
    mempoolSocket.send(JSON.stringify({ "track-address": "stop" }));
    mempoolSocket.send(JSON.stringify({ "track-scriptpubkeys": [] }));
    return;
  }

  if (watchedLookup.mode === "pubkey" && watchedLookup.scriptPubKey) {
    mempoolSocket.send(JSON.stringify({ "track-address": "stop" }));
    mempoolSocket.send(
      JSON.stringify({
        "track-scriptpubkeys": [watchedLookup.scriptPubKey],
      }),
    );
    return;
  }

  mempoolSocket.send(JSON.stringify({ "track-scriptpubkeys": [] }));
  mempoolSocket.send(
    JSON.stringify({ "track-address": watchedLookup.displayValue }),
  );
}

function parseJsonField(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  return raw;
}

function handleAddressTransactions(raw) {
  const txs = parseJsonField(raw);
  if (!Array.isArray(txs)) return;

  notifyNewMempoolTxs(txs, "address");
}

function handleScriptPubkeyTransactions(raw) {
  const data = parseJsonField(raw);
  if (!data || typeof data !== "object") return;

  const txs = [];

  for (const bucket of Object.values(data)) {
    for (const tx of bucket?.mempool || []) {
      if (tx?.txid) txs.push(tx);
    }
  }

  notifyNewMempoolTxs(txs, "address");
}

function parseMempoolDelta(rawDelta) {
  return parseJsonField(rawDelta);
}

function handleMempoolDelta(rawDelta) {
  const delta = parseMempoolDelta(rawDelta);
  const added = delta?.added;
  if (!Array.isArray(added) || added.length === 0) return;

  const purpleTxs = [];
  const feeTxs = [];

  for (const tx of added) {
    const txid = typeof tx === "string" ? tx : tx?.txid;
    if (!txid) continue;

    if (watchedLookup && typeof tx === "object" && transactionTouchesWatch(tx)) {
      purpleTxs.push(tx);
    } else {
      feeTxs.push(tx);
    }
  }

  notifyNewMempoolTxs(purpleTxs, "address");
  notifyNewMempoolTxs(feeTxs, "default");
}

function parseSocketMessage(raw) {
  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(err);
    return null;
  }
}

function handleSocketMessage(message) {
  if (message["address-transactions"]) {
    handleAddressTransactions(message["address-transactions"]);
  }

  if (message["multi-scriptpubkey-transactions"]) {
    handleScriptPubkeyTransactions(message["multi-scriptpubkey-transactions"]);
  }

  if (message["mempool-transactions"]) {
    handleMempoolDelta(message["mempool-transactions"]);
  }
}

function getCurrentWsUrl() {
  const providers = getMempoolWsProviders();
  return providers[wsProviderIndex % providers.length];
}

function rotateWsProvider() {
  const providers = getMempoolWsProviders();
  if (providers.length === 0) return;
  wsProviderIndex = (wsProviderIndex + 1) % providers.length;
}

function clearWsConnectTimer() {
  if (wsConnectTimer !== null) {
    window.clearTimeout(wsConnectTimer);
    wsConnectTimer = null;
  }
}

async function pollMempoolRecent() {
  try {
    const recent = await fetchMempoolRecent();
    if (!Array.isArray(recent)) return;

    if (!recentPollInitialized) {
      recent.forEach((tx) => {
        if (tx?.txid) rememberTxid(tx.txid);
      });
      recentPollInitialized = true;
      return;
    }

    notifyNewMempoolTxs(recent, "default");
  } catch (err) {
    console.error(err);
  }
}

function startRecentPollFallback() {
  if (recentPollTimer !== null) return;

  void pollMempoolRecent();
  recentPollTimer = window.setInterval(pollMempoolRecent, RECENT_POLL_MS);
}

function scheduleReconnect({ rotateProvider = true } = {}) {
  if (reconnectTimer !== null) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    if (rotateProvider) {
      rotateWsProvider();
    }
    connectMempoolWebSocket();
  }, WS_RECONNECT_MS);
}

function connectMempoolWebSocket() {
  clearWsConnectTimer();

  if (mempoolSocket) {
    mempoolSocket.close();
    mempoolSocket = null;
  }

  const wsUrl = getCurrentWsUrl();

  try {
    mempoolSocket = new WebSocket(wsUrl);
  } catch (err) {
    console.error(err);
    rotateWsProvider();
    scheduleReconnect({ rotateProvider: false });
    return;
  }

  wsConnectTimer = window.setTimeout(() => {
    if (mempoolSocket?.readyState !== WebSocket.OPEN) {
      mempoolSocket?.close();
      rotateWsProvider();
      scheduleReconnect({ rotateProvider: false });
    }
  }, WS_CONNECT_TIMEOUT_MS);

  mempoolSocket.addEventListener("open", () => {
    clearWsConnectTimer();
    mempoolSocket.send(JSON.stringify({ action: "init" }));
    mempoolSocket.send(JSON.stringify({ "track-mempool": true }));
    sendWatchSubscription();
  });

  mempoolSocket.addEventListener("message", (event) => {
    const message = parseSocketMessage(event.data);
    if (!message) return;
    handleSocketMessage(message);
  });

  mempoolSocket.addEventListener("close", () => {
    clearWsConnectTimer();
    mempoolSocket = null;
    scheduleReconnect();
  });

  mempoolSocket.addEventListener("error", () => {
    mempoolSocket?.close();
  });
}

function startGlobalMempoolWatch() {
  startRecentPollFallback();
  connectMempoolWebSocket();
}

function isMempoolSocketConnected() {
  return mempoolSocket?.readyState === WebSocket.OPEN;
}

window.spawnFallingBlocks = spawnFallingBlocks;
window.spawnAddressBlocks = spawnAddressBlocks;
window.setWatchedLookup = setWatchedLookup;
window.clearWatchedLookup = clearWatchedLookup;
window.isMempoolSocketConnected = isMempoolSocketConnected;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGlobalMempoolWatch);
} else {
  startGlobalMempoolWatch();
}