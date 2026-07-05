function resetLookupUiState() {
  stopTimeSinceTimer();
  stopBalanceSubCycle();
  stopAutoRefresh();
  resetTransactionLookupState();
  hideQrPanel();
  AppState.currentLookupInput = null;
  AppState.lastTxTimestamp = null;
  AppState.lastAppliedData = null;
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
    setWatchedLookup(data.watchTarget);
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

function performLookup() {
  const input = AppDom.addressInput.value.trim();
  if (!input) {
    showError(t("errorEmpty"));
    return;
  }

  if (isValidTxid(input)) {
    lookupTransaction();
    return;
  }

  lookupAddress();
}

window.resetLookupUiState = resetLookupUiState;
window.lookupTransaction = lookupTransaction;
window.lookupAddress = lookupAddress;
window.performLookup = performLookup;