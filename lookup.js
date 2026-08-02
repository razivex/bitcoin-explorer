function resetLookupUiState() {
  stopTimeSinceTimer();
  stopBalanceSubCycle();
  stopAutoRefresh();
  resetTransactionLookupState();
  hideQrPanel();
  hideActionMenu();
  hideExportOverlay();
  if (typeof hideInvoiceOverlay === "function") {
    hideInvoiceOverlay();
  }
  if (typeof hideLightningResults === "function") {
    hideLightningResults();
  }
  if (typeof resetStatOdometer === "function") {
    resetStatOdometer(AppDom.balanceBtcEl);
  }
  AppState.currentLookupInput = null;
  AppState.currentNetwork = null;
  AppState.lastTxTimestamp = null;
  AppState.lastAppliedData = null;
  AppState.lastAppliedLnData = null;
  AppState.currentLnAddress = null;
  clearWatchedLookup();
  resetTxWatchState();
}

async function lookupTransaction() {
  const generation = ++AppState.txLookupGeneration;
  ++AppState.lookupGeneration;

  clearError();
  resetLookupUiState();

  const txid = AppDom.addressInput.value.trim().toLowerCase();

  AppDom.lookupBtn.disabled = true;
  AppDom.lookupBtn.textContent = t("loading");

  try {
    const data = await loadTransactionData(txid);
    if (generation !== AppState.txLookupGeneration) return;

    applyTransactionData(data, { silent: false });
    startTxAutoRefresh();
  } catch (err) {
    if (generation === AppState.txLookupGeneration) {
      showError(t("errorTxFetch"));
    }
    console.error(err);
  } finally {
    if (generation === AppState.txLookupGeneration) {
      AppDom.lookupBtn.disabled = false;
      AppDom.lookupBtn.textContent = t("check");
    }
  }
}

async function lookupAddress() {
  const generation = ++AppState.lookupGeneration;
  ++AppState.txLookupGeneration;

  clearError();
  resetLookupUiState();

  const address = AppDom.addressInput.value.trim();

  AppDom.lookupBtn.disabled = true;
  AppDom.lookupBtn.textContent = t("loading");

  try {
    const data = await loadAddressData(address);
    if (generation !== AppState.lookupGeneration) return;

    applyAddressData(data, { silent: false });
    AppDom.txResultEl.classList.remove("show");
    hideLightningResults();
    // Address mempool watch uses Bitcoin WebSocket providers only.
    if (data.network !== "liquid") {
      setWatchedLookup(data.watchTarget);
    } else {
      clearWatchedLookup();
    }
    startAutoRefresh();
  } catch (err) {
    if (generation === AppState.lookupGeneration) {
      const message =
        err?.message === "Invalid public key hex"
          ? t("errorInvalidPubkey")
          : t("errorFetch");
      showError(message);
    }
    console.error(err);
  } finally {
    if (generation === AppState.lookupGeneration) {
      AppDom.lookupBtn.disabled = false;
      AppDom.lookupBtn.textContent = t("check");
    }
  }
}

async function lookupLightningChannel() {
  const generation = ++AppState.lookupGeneration;
  ++AppState.txLookupGeneration;

  clearError();
  resetLookupUiState();

  const input = AppDom.addressInput.value.trim();

  AppDom.lookupBtn.disabled = true;
  AppDom.lookupBtn.textContent = t("loading");

  try {
    const data = await loadLightningChannelData(input);
    if (generation !== AppState.lookupGeneration) return;

    applyLightningChannelData(data, { silent: false });
  } catch (err) {
    if (generation === AppState.lookupGeneration) {
      showError(t("errorLnChannelFetch"));
    }
    console.error(err);
  } finally {
    if (generation === AppState.lookupGeneration) {
      AppDom.lookupBtn.disabled = false;
      AppDom.lookupBtn.textContent = t("check");
    }
  }
}

async function lookupLightningAddress() {
  const generation = ++AppState.lookupGeneration;
  ++AppState.txLookupGeneration;

  clearError();
  resetLookupUiState();

  const input = AppDom.addressInput.value.trim();

  AppDom.lookupBtn.disabled = true;
  AppDom.lookupBtn.textContent = t("loading");

  try {
    const data = await loadLightningAddressData(input);
    if (generation !== AppState.lookupGeneration) return;

    applyLightningAddressData(data, { silent: false });
  } catch (err) {
    if (generation === AppState.lookupGeneration) {
      showError(t("errorLnAddressFetch"));
    }
    console.error(err);
  } finally {
    if (generation === AppState.lookupGeneration) {
      AppDom.lookupBtn.disabled = false;
      AppDom.lookupBtn.textContent = t("check");
    }
  }
}

async function lookupLightningInvoice() {
  const generation = ++AppState.lookupGeneration;
  ++AppState.txLookupGeneration;

  clearError();
  resetLookupUiState();

  const input = AppDom.addressInput.value.trim();

  AppDom.lookupBtn.disabled = true;
  AppDom.lookupBtn.textContent = t("loading");

  try {
    const data = await loadLightningInvoiceData(input);
    if (generation !== AppState.lookupGeneration) return;

    applyLightningInvoiceData(data, { silent: false });
  } catch (err) {
    if (generation === AppState.lookupGeneration) {
      showError(t("errorLnInvoiceDecode"));
    }
    console.error(err);
  } finally {
    if (generation === AppState.lookupGeneration) {
      AppDom.lookupBtn.disabled = false;
      AppDom.lookupBtn.textContent = t("check");
    }
  }
}

/**
 * @param {{ preserveBackTarget?: boolean }} [options]
 */
function performLookup(options = {}) {
  const { preserveBackTarget = false } = options;

  if (!preserveBackTarget) {
    clearLookupBackTarget();
  }

  const input = AppDom.addressInput.value.trim();
  if (!input) {
    showError(t("errorEmpty"));
    return;
  }

  if (isValidTxid(input)) {
    lookupTransaction();
    return;
  }

  if (typeof isBolt11Invoice === "function" ? isBolt11Invoice(input) : isValidBolt11Invoice(input)) {
    lookupLightningInvoice();
    return;
  }

  if (isLightningAddress(input)) {
    lookupLightningAddress();
    return;
  }

  if (isLightningChannelId(input)) {
    lookupLightningChannel();
    return;
  }

  lookupAddress();
}

/**
 * Fill the search field and run the same path as a manual Check click.
 * Used by in-app links (e.g. channel funding / closing txids).
 *
 * @param {string} value
 * @param {{ backTo?: { kind: "channel", input: string } | null }} [options]
 *   When `backTo` is set, the transaction card can offer a control to return
 *   to that prior lookup. Other navigations clear any existing back target.
 */
function navigateToSearch(value, options = {}) {
  const input = String(value ?? "").trim();
  if (!input || !AppDom.addressInput) return;

  if (options.backTo?.kind === "channel" && options.backTo.input) {
    AppState.lookupBackTarget = {
      kind: "channel",
      input: String(options.backTo.input).trim(),
    };
  } else {
    clearLookupBackTarget();
  }

  AppDom.addressInput.value = input;
  AppDom.addressInput.focus();
  performLookup({ preserveBackTarget: Boolean(options.backTo) });
}

function clearLookupBackTarget() {
  AppState.lookupBackTarget = null;
  updateTxBackButton();
}

/**
 * Return to the initial main page state (empty search, no results),
 * equivalent to opening index.html for the first time.
 */
function goToHome(event) {
  if (event) {
    event.preventDefault();
  }

  ++AppState.lookupGeneration;
  ++AppState.txLookupGeneration;

  if (AppDom.addressInput) {
    AppDom.addressInput.value = "";
  }

  clearError();
  resetLookupUiState();
  clearLookupBackTarget();

  AppDom.resultEl?.classList.remove("show");
  AppDom.txResultEl?.classList.remove("show");

  if (AppDom.lookupBtn) {
    AppDom.lookupBtn.disabled = false;
    AppDom.lookupBtn.textContent = t("check");
  }

  if (typeof showAppView === "function") {
    showAppView("check");
  }

  // Never focus the search field on home — on mobile that opens the keyboard.
  AppDom.addressInput?.blur();
}

/**
 * Switch between the check search card and Network / Valuation stats pages.
 * @param {"check" | "network" | "valuation"} view
 */
function showAppView(view) {
  const next = view === "network" || view === "valuation" ? view : "check";

  const views = [
    ["check", AppDom.checkViewEl],
    ["network", AppDom.networkViewEl],
    ["valuation", AppDom.valuationViewEl],
  ];

  for (const [name, el] of views) {
    if (!el) continue;
    el.hidden = name !== next;
  }

  AppDom.navNetworkBtn?.classList.toggle("is-active", next === "network");
  AppDom.navValuationBtn?.classList.toggle("is-active", next === "valuation");

  if (next === "network" || next === "valuation") {
    if (typeof updateBlockHeightTooltip === "function") {
      updateBlockHeightTooltip();
    }
  }
}

function bindNavViewEvents() {
  AppDom.navNetworkBtn?.addEventListener("click", () => {
    showAppView("network");
  });
  AppDom.navValuationBtn?.addEventListener("click", () => {
    showAppView("valuation");
  });
}

function getChannelBackTarget() {
  const fromState =
    AppState.currentLookupInput ||
    AppState.lastAppliedLnData?.shortId ||
    AppState.lastAppliedLnData?.channelId ||
    AppState.lastAppliedLnData?.input;
  if (!fromState) return null;
  return { kind: "channel", input: String(fromState).trim() };
}

function goBackFromTransaction() {
  const target = AppState.lookupBackTarget;
  if (!target?.input) return;

  const input = target.input;
  clearLookupBackTarget();
  navigateToSearch(input);
}

function updateTxBackButton() {
  const btn = AppDom.txBackBtn;
  if (!btn) return;

  const show =
    Boolean(AppState.lookupBackTarget?.kind === "channel") &&
    Boolean(AppState.lookupBackTarget?.input) &&
    Boolean(AppDom.txResultEl?.classList.contains("show"));

  btn.hidden = !show;
}

window.resetLookupUiState = resetLookupUiState;
window.lookupTransaction = lookupTransaction;
window.lookupAddress = lookupAddress;
window.lookupLightningChannel = lookupLightningChannel;
window.lookupLightningAddress = lookupLightningAddress;
window.lookupLightningInvoice = lookupLightningInvoice;
window.performLookup = performLookup;
window.navigateToSearch = navigateToSearch;
window.clearLookupBackTarget = clearLookupBackTarget;
window.getChannelBackTarget = getChannelBackTarget;
window.goBackFromTransaction = goBackFromTransaction;
window.goToHome = goToHome;
window.showAppView = showAppView;
window.bindNavViewEvents = bindNavViewEvents;
window.updateTxBackButton = updateTxBackButton;