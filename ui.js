function showError(message) {
  AppDom.errorEl.textContent = message;
  AppDom.errorEl.classList.add("show");
  AppDom.resultEl.classList.remove("show");
  AppDom.txResultEl.classList.remove("show");
}

function clearError() {
  AppDom.errorEl.textContent = "";
  AppDom.errorEl.classList.remove("show");
}

function stopTimeSinceTimer() {
  if (AppState.timeSinceLastInterval !== null) {
    clearInterval(AppState.timeSinceLastInterval);
    AppState.timeSinceLastInterval = null;
  }
}

function stopTxTimeSinceConfirmationTimer() {
  if (AppState.txTimeSinceConfirmationInterval !== null) {
    clearInterval(AppState.txTimeSinceConfirmationInterval);
    AppState.txTimeSinceConfirmationInterval = null;
  }
}

function stopTxAutoRefresh() {
  if (AppState.txAutoRefreshInterval !== null) {
    clearInterval(AppState.txAutoRefreshInterval);
    AppState.txAutoRefreshInterval = null;
  }
}

function stopBalanceSubCycle() {
  if (AppState.balanceSubInterval !== null) {
    clearInterval(AppState.balanceSubInterval);
    AppState.balanceSubInterval = null;
  }
}

function stopAutoRefresh() {
  if (AppState.autoRefreshInterval !== null) {
    clearInterval(AppState.autoRefreshInterval);
    AppState.autoRefreshInterval = null;
  }
}

function startTimeSinceTimer(fromDate) {
  stopTimeSinceTimer();

  if (!fromDate) return;

  const tick = () => {
    AppDom.timeSinceLastEl.textContent = formatTimeSince(
      getTimeSinceParts(fromDate),
    );
  };

  tick();
  AppState.timeSinceLastInterval = setInterval(tick, 1000);
}

function fitBalanceBtcToWidth() {
  if (!AppDom.balanceBtcEl || !AppDom.resultEl.classList.contains("show")) {
    return;
  }

  AppDom.balanceBtcEl.style.fontSize = `${AppConstants.BALANCE_BTC_MAX_FONT_PX}px`;

  if (AppDom.balanceBtcEl.clientWidth === 0) return;

  let fontSize = AppConstants.BALANCE_BTC_MAX_FONT_PX;
  while (
    fontSize > AppConstants.BALANCE_BTC_MIN_FONT_PX &&
    AppDom.balanceBtcEl.scrollWidth > AppDom.balanceBtcEl.clientWidth
  ) {
    fontSize -= 1;
    AppDom.balanceBtcEl.style.fontSize = `${fontSize}px`;
  }
}

function scheduleBalanceBtcFit() {
  requestAnimationFrame(() => {
    fitBalanceBtcToWidth();
  });
}

function fitMetaAddressToWidth() {
  const fullAddress = AppDom.metaAddressEl.dataset.fullAddress;
  if (!fullAddress || !AppDom.resultEl.classList.contains("show")) return;

  AppDom.metaAddressEl.textContent = fullAddress;

  if (AppDom.metaAddressEl.clientWidth === 0) return;

  if (AppDom.metaAddressEl.scrollWidth <= AppDom.metaAddressEl.clientWidth) {
    return;
  }

  for (let len = fullAddress.length - 1; len >= 12; len -= 1) {
    AppDom.metaAddressEl.textContent = truncateMiddle(fullAddress, len);
    if (AppDom.metaAddressEl.scrollWidth <= AppDom.metaAddressEl.clientWidth) {
      return;
    }
  }

  AppDom.metaAddressEl.textContent = truncateMiddle(fullAddress, 12);
}

function setMetaAddressDisplay(fullAddress) {
  AppDom.metaAddressEl.dataset.fullAddress = fullAddress;
  AppDom.metaAddressEl.title = fullAddress;
  AppDom.metaAddressEl.textContent = fullAddress;

  requestAnimationFrame(() => {
    fitMetaAddressToWidth();
  });
}

function fitTxValueBtcToWidth() {
  if (!AppDom.txValueBtcEl || !AppDom.txResultEl.classList.contains("show")) {
    return;
  }

  AppDom.txValueBtcEl.style.fontSize = `${AppConstants.BALANCE_BTC_MAX_FONT_PX}px`;

  if (AppDom.txValueBtcEl.clientWidth === 0) return;

  let fontSize = AppConstants.BALANCE_BTC_MAX_FONT_PX;
  while (
    fontSize > AppConstants.BALANCE_BTC_MIN_FONT_PX &&
    AppDom.txValueBtcEl.scrollWidth > AppDom.txValueBtcEl.clientWidth
  ) {
    fontSize -= 1;
    AppDom.txValueBtcEl.style.fontSize = `${fontSize}px`;
  }
}

function scheduleTxValueBtcFit() {
  requestAnimationFrame(() => {
    fitTxValueBtcToWidth();
  });
}

window.showError = showError;
window.clearError = clearError;
window.stopTimeSinceTimer = stopTimeSinceTimer;
window.stopTxTimeSinceConfirmationTimer = stopTxTimeSinceConfirmationTimer;
window.stopTxAutoRefresh = stopTxAutoRefresh;
window.stopBalanceSubCycle = stopBalanceSubCycle;
window.stopAutoRefresh = stopAutoRefresh;
window.startTimeSinceTimer = startTimeSinceTimer;
window.fitBalanceBtcToWidth = fitBalanceBtcToWidth;
window.scheduleBalanceBtcFit = scheduleBalanceBtcFit;
window.fitMetaAddressToWidth = fitMetaAddressToWidth;
window.setMetaAddressDisplay = setMetaAddressDisplay;
window.fitTxValueBtcToWidth = fitTxValueBtcToWidth;
window.scheduleTxValueBtcFit = scheduleTxValueBtcFit;