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

  const rawData = await fetchMempoolJson(
    `/${apiBasePath}/${encodedQueryKey}`,
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
    fetchMempoolJson(`/${apiBasePath}/${encodedQueryKey}/txs/chain`).catch(
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

  const watchTarget = {
    mode: lookupTarget.mode,
    displayValue: lookupTarget.displayValue,
    queryKey: lookupTarget.queryKey,
    scriptPubKey:
      lookupTarget.mode === "pubkey"
        ? buildP2pkScriptPubKey(lookupTarget.displayValue)
        : null,
  };

  return {
    addressData,
    lookupMode: lookupTarget.mode,
    watchTarget,
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
  AppDom.balanceBtcEl.textContent = `${formatBtc(data.confirmedBtc)} BTC`;
  scheduleBalanceBtcFit();

  const arrows = getUnconfirmedArrowState(data.addressData.mempool_stats);
  AppState.balanceSubState.arrowUp = arrows.up;
  AppState.balanceSubState.arrowDown = arrows.down;

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

  AppDom.metaAddressLabelEl.textContent =
    data.lookupMode === "pubkey" ? t("publicKey") : t("address");
  setMetaAddressDisplay(data.addressData.address);
  AppDom.metaAddressTypeEl.textContent = getAddressType(data.addressData.address, {
    isPublicKey: data.lookupMode === "pubkey",
  });
  AppDom.metaExposedPubKeyEl.textContent = formatExposedPubKey(data.exposedPubKey);
  AppDom.metaTransactionsEl.textContent = data.txCount;
  AppDom.metaLastTxDateEl.textContent = data.lastTxDateObj
    ? formatDateTime(data.lastTxDateObj)
    : t("na");

  const nextLastTimestamp = data.lastTxDateObj?.getTime() ?? null;
  if (data.lastTxDateObj) {
    if (nextLastTimestamp !== AppState.lastTxTimestamp) {
      AppState.lastTxTimestamp = nextLastTimestamp;
      startTimeSinceTimer(data.lastTxDateObj);
    }
  } else {
    AppState.lastTxTimestamp = null;
    stopTimeSinceTimer();
    AppDom.timeSinceLastEl.textContent = t("na");
  }

  detectAndPlayTxSounds(data, { silent });

  AppState.lastAppliedData = data;
  AppState.currentLookupInput = data.addressData.address;
  AppDom.resultEl.classList.add("show");
}

async function refreshAddressSilently() {
  if (!AppState.currentLookupInput || AppState.refreshInFlight) return;

  const targetInput = AppState.currentLookupInput;
  const generation = AppState.lookupGeneration;
  AppState.refreshInFlight = true;

  try {
    const data = await loadAddressData(targetInput);
    if (
      generation !== AppState.lookupGeneration ||
      targetInput !== AppState.currentLookupInput ||
      data.addressData.address !== targetInput
    ) {
      return;
    }

    applyAddressData(data, { silent: true });
  } catch (err) {
    console.error(err);
  } finally {
    AppState.refreshInFlight = false;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  AppState.autoRefreshInterval = setInterval(
    refreshAddressSilently,
    AppConstants.UPDATE_INTERVAL_MS,
  );
}

window.loadAddressData = loadAddressData;
window.applyAddressData = applyAddressData;
window.refreshAddressSilently = refreshAddressSilently;
window.startAutoRefresh = startAutoRefresh;