function resolveAddressNetwork(address) {
  if (isLiquidAddress(address)) return "liquid";
  return "bitcoin";
}

function getChainFetchJson(network) {
  return network === "liquid" ? fetchLiquidJson : fetchMempoolJson;
}

async function loadAddressData(address) {
  const network = resolveAddressNetwork(address);
  const fetchJson = getChainFetchJson(network);

  let lookupTarget;
  try {
    lookupTarget = await resolveLookupTarget(address);
  } catch (err) {
    if (isHexPublicKey(address)) {
      throw new Error("Invalid public key hex");
    }
    throw err;
  }

  // Public key / P2PK scripthash lookups are Bitcoin-only in this app.
  if (lookupTarget.mode === "pubkey" && network === "liquid") {
    throw new Error("Invalid public key hex");
  }

  const encodedQueryKey = encodeURIComponent(lookupTarget.queryKey);
  const isPublicKeyLookup = lookupTarget.mode === "pubkey";
  const apiBasePath = isPublicKeyLookup ? "scripthash" : "address";

  const rawData = await fetchJson(`/${apiBasePath}/${encodedQueryKey}`);

  const addressData = isPublicKeyLookup
    ? {
        ...rawData,
        address: lookupTarget.displayValue,
        is_pubkey: true,
      }
    : rawData;

  if (!isValidAddressData(addressData, { network })) {
    throw new Error("Invalid address response");
  }

  const txCount = addressData.chain_stats.tx_count ?? 0;
  const mempoolTxCount = addressData.mempool_stats?.tx_count ?? 0;

  const [chainTxs, fiatPrice] = await Promise.all([
    fetchJson(`/${apiBasePath}/${encodedQueryKey}/txs/chain`).catch(() => []),
    fetchFiatPrice(),
  ]);

  const chainHasSums = hasStatsSums(addressData.chain_stats);
  const mempoolHasSums = hasStatsSums(addressData.mempool_stats);

  const balanceConfidential = network === "liquid" && !chainHasSums;
  const unconfirmedConfidential =
    network === "liquid" && !mempoolHasSums && mempoolTxCount > 0;

  const confirmedSats = chainHasSums ? calcBalance(addressData.chain_stats) : null;
  const unconfirmedSats = mempoolHasSums
    ? calcBalance(addressData.mempool_stats)
    : unconfirmedConfidential
      ? null
      : 0;
  const confirmedBtc =
    confirmedSats === null ? null : satsToBtc(confirmedSats);
  const unconfirmedBtc =
    unconfirmedSats === null ? null : satsToBtc(unconfirmedSats);
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
    network,
    scriptPubKey:
      lookupTarget.mode === "pubkey"
        ? buildP2pkScriptPubKey(lookupTarget.displayValue)
        : null,
  };

  return {
    addressData,
    network,
    lookupMode: lookupTarget.mode,
    watchTarget,
    balanceConfidential,
    unconfirmedConfidential,
    confirmedBtc,
    unconfirmedSats,
    unconfirmedBtc,
    fiatPrice,
    addressType: getAddressType(addressData.address, {
      isPublicKey: isPublicKeyLookup,
      network,
    }),
    exposedPubKey:
      network === "liquid" && isLiquidConfidentialAddress(addressData.address)
        ? null
        : isPublicKeyExposed(lookupTarget.mode, addressData),
    txCount,
    mempoolTxCount,
    lastConfirmedTxId: lastConfirmedTx?.txid ?? null,
    lastTxDate,
    lastTxDateObj,
  };
}

function applyAddressData(data, { silent = false } = {}) {
  AppState.currentNetwork = data.network || "bitcoin";

  AppDom.balanceBtcEl.textContent = formatAssetAmountLabel(data.confirmedBtc, {
    network: data.network,
    confidential: data.balanceConfidential || data.confirmedBtc === null,
  });
  scheduleBalanceBtcFit();

  if (data.balanceConfidential || data.confirmedBtc === null) {
    stopBalanceSubCycle();
    AppState.balanceSubState.arrowUp = false;
    AppState.balanceSubState.arrowDown = false;
    AppState.balanceSubState.hasUnconfirmed = false;
    AppState.balanceSubState.usdText = t("confidential");
    AppState.balanceSubState.unconfirmedText = "";
    renderBalanceSubLine(t("confidential"));
    AppDom.balanceUnconfirmedEl.classList.remove("is-fading");
  } else {
    const arrows = getUnconfirmedArrowState(data.addressData.mempool_stats);
    AppState.balanceSubState.arrowUp = arrows.up;
    AppState.balanceSubState.arrowDown = arrows.down;

    if (data.unconfirmedConfidential) {
      stopBalanceSubCycle();
      const fiatText = buildFiatText(data.confirmedBtc);
      AppState.balanceSubState = {
        hasUnconfirmed: true,
        showingUsd: true,
        usdText: fiatText,
        unconfirmedText: t("confidential"),
        arrowUp: false,
        arrowDown: false,
      };
      if (silent) {
        renderBalanceSubLine(
          AppState.balanceSubState.showingUsd
            ? fiatText
            : t("confidential"),
        );
      } else {
        startBalanceSubCycle(fiatText, t("confidential"));
      }
    } else if (silent) {
      updateBalanceSubSilently(
        data.confirmedBtc,
        data.unconfirmedSats ?? 0,
        data.unconfirmedBtc ?? 0,
        data.fiatPrice,
        data.addressData.mempool_stats,
      );
    } else {
      setupBalanceSub(
        data.confirmedBtc,
        data.unconfirmedSats ?? 0,
        data.unconfirmedBtc ?? 0,
        data.fiatPrice,
        data.addressData.mempool_stats,
      );
    }
  }

  AppDom.metaAddressLabelEl.textContent =
    data.lookupMode === "pubkey" ? t("publicKey") : t("address");
  setMetaAddressDisplay(data.addressData.address);
  if (AppDom.metaNetworkEl) {
    AppDom.metaNetworkEl.textContent =
      data.network === "liquid" ? t("networkLiquid") : t("networkBitcoin");
  }
  AppDom.metaAddressTypeEl.textContent = getAddressType(data.addressData.address, {
    isPublicKey: data.lookupMode === "pubkey",
    network: data.network,
  });
  AppDom.metaExposedPubKeyEl.textContent =
    data.exposedPubKey === null
      ? t("confidential")
      : formatExposedPubKey(data.exposedPubKey);
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

window.resolveAddressNetwork = resolveAddressNetwork;
window.loadAddressData = loadAddressData;
window.applyAddressData = applyAddressData;
window.refreshAddressSilently = refreshAddressSilently;
window.startAutoRefresh = startAutoRefresh;
