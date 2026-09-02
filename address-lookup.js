function resolveAddressNetwork(address) {
  if (typeof looksLikeSilentPaymentAddress === "function" &&
      looksLikeSilentPaymentAddress(address)) {
    const decoded =
      typeof decodeSilentPaymentAddress === "function"
        ? decodeSilentPaymentAddress(address)
        : null;
    if (decoded?.network) return decoded.network;
  }
  if (isLiquidAddress(address)) return "liquid";
  return "bitcoin";
}

function formatLookupNetwork(network) {
  if (network === "liquid") return t("networkLiquid");
  if (network === "bitcoin-testnet") return t("networkBitcoinTestnet");
  return t("networkBitcoin");
}

function buildSilentPaymentLookupData(decoded) {
  return {
    addressData: {
      address: decoded.address,
      chain_stats: { tx_count: 0 },
      mempool_stats: { tx_count: 0 },
    },
    network: decoded.network,
    lookupMode: "silent",
    watchTarget: null,
    balanceConfidential: true,
    unconfirmedConfidential: false,
    confirmedBtc: null,
    unconfirmedSats: 0,
    unconfirmedBtc: 0,
    addressType: t("addressTypeSilentPayment"),
    exposedPubKey: null,
    txCount: 0,
    mempoolTxCount: 0,
    lastConfirmedTxId: null,
    lastTxDate: t("na"),
    lastTxDateObj: null,
    silentPayment: true,
    scanKey: decoded.scanKey,
    spendKey: decoded.spendKey,
  };
}

function setSilentPaymentMetaVisibility(isSilent) {
  if (AppDom.metaExposedPubKeyRowEl) {
    AppDom.metaExposedPubKeyRowEl.hidden = isSilent;
  }
  if (AppDom.metaScanKeyRowEl) {
    AppDom.metaScanKeyRowEl.hidden = !isSilent;
  }
  if (AppDom.metaSpendKeyRowEl) {
    AppDom.metaSpendKeyRowEl.hidden = !isSilent;
  }
  if (AppDom.metaTransactionsRowEl) {
    AppDom.metaTransactionsRowEl.hidden = isSilent;
  }
  if (AppDom.metaLastTxDateRowEl) {
    AppDom.metaLastTxDateRowEl.hidden = isSilent;
  }
  if (AppDom.metaTimeSinceLastRowEl) {
    AppDom.metaTimeSinceLastRowEl.hidden = isSilent;
  }
  if (AppDom.actionExportItem) {
    AppDom.actionExportItem.hidden = isSilent;
  }
}

function getChainFetchJson(network) {
  return network === "liquid" ? fetchLiquidJson : fetchMempoolJson;
}

async function loadAddressData(address) {
  if (
    typeof looksLikeSilentPaymentAddress === "function" &&
    looksLikeSilentPaymentAddress(address)
  ) {
    const decoded =
      typeof decodeSilentPaymentAddress === "function"
        ? decodeSilentPaymentAddress(address)
        : null;
    if (!decoded) {
      if (
        typeof isIncompleteSilentPaymentAddress === "function" &&
        isIncompleteSilentPaymentAddress(address)
      ) {
        throw new Error("Incomplete silent payment address");
      }
      throw new Error("Invalid silent payment address");
    }
    return buildSilentPaymentLookupData(decoded);
  }

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

  const chainTxs = await fetchJson(
    `/${apiBasePath}/${encodedQueryKey}/txs/chain`,
  ).catch(() => []);

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

  const balanceConfidential =
    data.balanceConfidential || data.confirmedBtc === null;
  const balanceText = formatAssetAmountLabel(data.confirmedBtc, {
    network: data.network,
    confidential: balanceConfidential,
  });
  const balanceValue =
    !balanceConfidential && Number.isFinite(Number(data.confirmedBtc))
      ? Number(data.confirmedBtc)
      : null;

  if (typeof setStatValue === "function") {
    // Animate only on silent refresh of the same address; snap on new lookups.
    setStatValue(AppDom.balanceBtcEl, {
      text: balanceText,
      value: balanceValue,
      instant: !silent,
    });
  } else {
    AppDom.balanceBtcEl.textContent = balanceText;
  }
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
        getFiatPrice(),
        data.addressData.mempool_stats,
      );
    } else {
      setupBalanceSub(
        data.confirmedBtc,
        data.unconfirmedSats ?? 0,
        data.unconfirmedBtc ?? 0,
        getFiatPrice(),
        data.addressData.mempool_stats,
      );
    }
  }

  const isSilent = Boolean(data.silentPayment || data.lookupMode === "silent");
  setSilentPaymentMetaVisibility(isSilent);

  AppDom.metaAddressLabelEl.textContent =
    data.lookupMode === "pubkey" ? t("publicKey") : t("address");
  setMetaAddressDisplay(data.addressData.address);
  if (AppDom.metaNetworkEl) {
    AppDom.metaNetworkEl.textContent = formatLookupNetwork(data.network);
  }
  AppDom.metaAddressTypeEl.textContent = isSilent
    ? t("addressTypeSilentPayment")
    : getAddressType(data.addressData.address, {
        isPublicKey: data.lookupMode === "pubkey",
        network: data.network,
      });
  if (isSilent) {
    if (typeof setMetaFieldDisplay === "function") {
      setMetaFieldDisplay(AppDom.metaScanKeyEl, data.scanKey || "");
      setMetaFieldDisplay(AppDom.metaSpendKeyEl, data.spendKey || "");
    } else {
      if (AppDom.metaScanKeyEl) AppDom.metaScanKeyEl.textContent = data.scanKey || "";
      if (AppDom.metaSpendKeyEl) {
        AppDom.metaSpendKeyEl.textContent = data.spendKey || "";
      }
    }
  } else {
    AppDom.metaExposedPubKeyEl.textContent =
      data.exposedPubKey === null
        ? t("confidential")
        : formatExposedPubKey(data.exposedPubKey);
    AppDom.metaTransactionsEl.textContent = data.txCount;
    AppDom.metaLastTxDateEl.textContent = data.lastTxDateObj
      ? formatDateTime(data.lastTxDateObj)
      : t("na");
  }

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

  if (!isSilent) {
    detectAndPlayTxSounds(data, { silent });
  }

  AppState.lastAppliedData = data;
  AppState.currentLookupInput = data.addressData.address;
  AppDom.resultEl.classList.add("show");

  if (typeof syncLivePricePolling === "function") {
    syncLivePricePolling();
  }
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
window.formatLookupNetwork = formatLookupNetwork;
window.setSilentPaymentMetaVisibility = setSilentPaymentMetaVisibility;
window.loadAddressData = loadAddressData;
window.applyAddressData = applyAddressData;
window.refreshAddressSilently = refreshAddressSilently;
window.startAutoRefresh = startAutoRefresh;
