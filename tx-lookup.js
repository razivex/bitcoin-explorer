function getTxConfirmationCount(blockHeight, network = "bitcoin") {
  const height = Number(blockHeight);
  const tip =
    network === "liquid"
      ? Number(AppState.cachedLiquidBlockHeight)
      : Number(AppState.cachedBlockHeight);
  if (!Number.isFinite(height) || !Number.isFinite(tip)) return null;
  return Math.max(0, tip - height + 1);
}

function formatTxConfirmations(confirmed, blockHeight, network = "bitcoin") {
  if (!confirmed) return "0";
  const count = getTxConfirmationCount(blockHeight, network);
  if (count === null) return t("na");
  return count.toLocaleString(getLocale());
}

function updateTxConfirmationsDisplay(data = AppState.lastAppliedTxData) {
  if (!data || !AppDom.txMetaConfirmationsEl) return;
  AppDom.txMetaConfirmationsEl.textContent = formatTxConfirmations(
    data.confirmed,
    data.blockHeight,
    data.network || "bitcoin",
  );
}

function formatTxFeeLine(feeSats, vsize, { confidential = false } = {}) {
  if (confidential || feeSats === null || feeSats === undefined) {
    return t("confidential");
  }

  const fee = Number(feeSats);
  const vbytes = Number(vsize);
  if (!Number.isFinite(fee) || !Number.isFinite(vbytes) || vbytes <= 0) {
    return t("na");
  }

  const rate = fee / vbytes;
  return t("txFeeLine", {
    rate: rate.toLocaleString(getLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    vsize: vbytes.toLocaleString(getLocale()),
    fee: fee.toLocaleString(getLocale()),
  });
}

async function fetchTxFirstSeenFromBlockAudit(txid, blockHash) {
  if (!blockHash) return null;

  try {
    const audit = await fetchMempoolBlockAudit(blockHash, txid);
    const timestamp = Number(audit?.firstSeen);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function fetchTxFirstSeen(txid, tx = null, network = "bitcoin") {
  // First-seen mempool timestamps are only available for Bitcoin mempool providers.
  if (network !== "bitcoin") return null;

  try {
    const times = await fetchMempoolTransactionTimes(txid);
    if (Array.isArray(times)) {
      const timestamp = Number(times[0]);
      if (Number.isFinite(timestamp) && timestamp > 0) {
        return timestamp;
      }
    }
  } catch (err) {
    console.error(err);
  }

  if (tx?.status?.confirmed) {
    return fetchTxFirstSeenFromBlockAudit(txid, tx.status.block_hash);
  }

  return null;
}

async function ensureLiquidTipHeight() {
  try {
    const height = await fetchLiquidTipHeight();
    if (Number.isFinite(height)) {
      AppState.cachedLiquidBlockHeight = height;
    }
    return height;
  } catch (err) {
    console.error(err);
    return AppState.cachedLiquidBlockHeight;
  }
}

async function loadTransactionDataForNetwork(txid, network) {
  const fetchJson = network === "liquid" ? fetchLiquidJson : fetchMempoolJson;
  const tx = await fetchJson(`/tx/${encodeURIComponent(txid)}`);

  if (!tx || typeof tx !== "object" || !tx.txid) {
    throw new Error("Invalid transaction response");
  }

  if (network === "liquid") {
    await ensureLiquidTipHeight();
  }

  const confirmed = Boolean(tx?.status?.confirmed);
  const firstSeenTs = await fetchTxFirstSeen(txid, tx, network);

  let outputSats;
  let outputConfidential = false;
  let feeSats;
  let feeConfidential = false;

  if (network === "liquid") {
    outputSats = calcLiquidTxOutputValue(tx);
    outputConfidential = outputSats === null;
    feeSats = getLiquidTxFeeSats(tx);
    feeConfidential = feeSats === null;
  } else {
    outputSats = calcTxOutputValue(tx);
    feeSats = Number(tx?.fee);
    if (!Number.isFinite(feeSats)) feeSats = null;
  }

  const embeddedData = detectEmbeddedData(tx);
  const vsize = getTxVsize(tx);

  return {
    tx,
    txid,
    network,
    confirmed,
    outputConfidential,
    feeConfidential,
    outputBtc:
      outputSats === null || outputSats === undefined
        ? null
        : satsToBtc(outputSats),
    hasEmbeddedData: embeddedData.length > 0,
    feeSats: Number.isFinite(feeSats) ? feeSats : null,
    vsize,
    blockTime: confirmed ? Number(tx.status.block_time) : null,
    firstSeenTs,
    firstSeenDate: firstSeenTs ? new Date(firstSeenTs * 1000) : null,
    confirmedDate:
      confirmed && tx.status.block_time
        ? new Date(tx.status.block_time * 1000)
        : null,
    blockHeight:
      confirmed && Number.isFinite(Number(tx.status.block_height))
        ? Number(tx.status.block_height)
        : null,
  };
}

async function loadTransactionData(txid) {
  try {
    return await loadTransactionDataForNetwork(txid, "bitcoin");
  } catch (bitcoinErr) {
    try {
      return await loadTransactionDataForNetwork(txid, "liquid");
    } catch (liquidErr) {
      console.warn("[tx-lookup] Liquid fallback failed:", liquidErr?.message);
      throw bitcoinErr;
    }
  }
}

function setTxIdDisplay(fullTxid) {
  AppDom.txMetaIdEl.dataset.fullAddress = fullTxid;
  AppDom.txMetaIdEl.title = fullTxid;
  AppDom.txMetaIdEl.textContent = fullTxid;

  requestAnimationFrame(() => {
    const fullValue = AppDom.txMetaIdEl.dataset.fullAddress;
    if (!fullValue || !AppDom.txResultEl.classList.contains("show")) return;

    AppDom.txMetaIdEl.textContent = fullValue;
    if (AppDom.txMetaIdEl.clientWidth === 0) return;

    if (AppDom.txMetaIdEl.scrollWidth <= AppDom.txMetaIdEl.clientWidth) return;

    for (let len = fullValue.length - 1; len >= 16; len -= 1) {
      AppDom.txMetaIdEl.textContent = truncateMiddle(fullValue, len);
      if (AppDom.txMetaIdEl.scrollWidth <= AppDom.txMetaIdEl.clientWidth) return;
    }

    AppDom.txMetaIdEl.textContent = truncateMiddle(fullValue, 16);
  });
}

function formatTimeFromFirstSeenToConfirmed(firstSeenDate, confirmedDate) {
  if (!firstSeenDate || !confirmedDate) return t("na");
  return formatTimeSince(getTimeSinceParts(firstSeenDate, confirmedDate));
}

function startTxTimeSinceConfirmationTimer(fromDate) {
  stopTxTimeSinceConfirmationTimer();
  if (!fromDate) {
    AppDom.txMetaTimeSinceConfirmationEl.textContent = t("na");
    return;
  }

  const tick = () => {
    AppDom.txMetaTimeSinceConfirmationEl.textContent = formatTimeSince(
      getTimeSinceParts(fromDate),
    );
  };

  tick();
  AppState.txTimeSinceConfirmationInterval = setInterval(tick, 1000);
}

function applyTransactionData(data, { silent = false } = {}) {
  AppState.currentNetwork = data.network || "bitcoin";

  AppDom.txValueBtcEl.textContent = formatAssetAmountLabel(data.outputBtc, {
    network: data.network,
    confidential: data.outputConfidential || data.outputBtc === null,
  });
  scheduleTxValueBtcFit();

  AppDom.txStatusSubEl.textContent = data.confirmed
    ? t("txConfirmed")
    : t("txUnconfirmed");
  AppDom.txStatusSubEl.className = data.confirmed
    ? "balance-unconfirmed"
    : "balance-unconfirmed tx-status-sub--unconfirmed";

  setTxIdDisplay(data.txid);

  const isLiquid = data.network === "liquid";
  if (AppDom.txMetaNetworkEl) {
    AppDom.txMetaNetworkEl.textContent = isLiquid
      ? t("networkLiquid")
      : t("networkBitcoin");
  }


  // Liquid has no mempool first-seen timestamps, so hide these fields.
  if (AppDom.txMetaDateRowEl) {
    AppDom.txMetaDateRowEl.hidden = isLiquid;
  }
  if (AppDom.txMetaTimeToConfirmationRowEl) {
    AppDom.txMetaTimeToConfirmationRowEl.hidden = isLiquid;
  }

  if (!isLiquid) {
    AppDom.txMetaDateEl.textContent = data.firstSeenDate
      ? formatDateTime(data.firstSeenDate)
      : t("na");
    AppDom.txMetaTimeToConfirmationEl.textContent = data.confirmed
      ? formatTimeFromFirstSeenToConfirmed(
          data.firstSeenDate,
          data.confirmedDate,
        )
      : t("na");
  }

  AppDom.txMetaConfirmedAtEl.textContent =
    data.confirmed && data.confirmedDate
      ? formatDateTime(data.confirmedDate)
      : t("na");

  if (data.confirmed && data.confirmedDate) {
    startTxTimeSinceConfirmationTimer(data.confirmedDate);
  } else {
    stopTxTimeSinceConfirmationTimer();
    AppDom.txMetaTimeSinceConfirmationEl.textContent = t("na");
  }

  AppDom.txMetaFeeEl.textContent = formatTxFeeLine(data.feeSats, data.vsize, {
    confidential: data.feeConfidential,
  });
  AppDom.txEmbeddedDataEl.textContent = data.hasEmbeddedData ? t("yes") : t("no");
  updateTxConfirmationsDisplay(data);

  detectAndPlayTxConfirmationSound(data, { silent });

  AppState.lastAppliedTxData = data;
  AppState.currentTxLookup = data.txid;
  AppDom.resultEl.classList.remove("show");
  AppDom.txResultEl.classList.add("show");
}

async function refreshTransactionSilently() {
  if (!AppState.currentTxLookup || AppState.refreshInFlight) return;

  const targetTxid = AppState.currentTxLookup;
  const generation = AppState.txLookupGeneration;
  const network = AppState.lastAppliedTxData?.network || "bitcoin";
  AppState.refreshInFlight = true;

  try {
    const data = await loadTransactionDataForNetwork(targetTxid, network);
    if (
      generation !== AppState.txLookupGeneration ||
      targetTxid !== AppState.currentTxLookup
    ) {
      return;
    }

    applyTransactionData(data, { silent: true });
  } catch (err) {
    console.error(err);
  } finally {
    AppState.refreshInFlight = false;
  }
}

function startTxAutoRefresh() {
  stopTxAutoRefresh();
  AppState.txAutoRefreshInterval = setInterval(
    refreshTransactionSilently,
    AppConstants.UPDATE_INTERVAL_MS,
  );
}

function resetTransactionLookupState() {
  stopTxTimeSinceConfirmationTimer();
  stopTxAutoRefresh();
  resetTxConfirmationWatchState();
  AppState.currentTxLookup = null;
  AppState.lastAppliedTxData = null;
}

window.getTxConfirmationCount = getTxConfirmationCount;
window.formatTxConfirmations = formatTxConfirmations;
window.updateTxConfirmationsDisplay = updateTxConfirmationsDisplay;
window.formatTxFeeLine = formatTxFeeLine;
window.fetchTxFirstSeenFromBlockAudit = fetchTxFirstSeenFromBlockAudit;
window.fetchTxFirstSeen = fetchTxFirstSeen;
window.loadTransactionDataForNetwork = loadTransactionDataForNetwork;
window.loadTransactionData = loadTransactionData;
window.setTxIdDisplay = setTxIdDisplay;
window.formatTimeFromFirstSeenToConfirmed = formatTimeFromFirstSeenToConfirmed;
window.startTxTimeSinceConfirmationTimer = startTxTimeSinceConfirmationTimer;
window.applyTransactionData = applyTransactionData;
window.refreshTransactionSilently = refreshTransactionSilently;
window.startTxAutoRefresh = startTxAutoRefresh;
window.resetTransactionLookupState = resetTransactionLookupState;
