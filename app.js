function initApp() {
  loadCachedMarketMetrics();
  startBlockHeightRefresh();
  startMarketMetricsRefresh();
}

function bindAppEvents() {
  AppDom.lookupBtn.addEventListener("click", performLookup);
  bindActionMenuEvents();
  AppDom.qrOverlay.addEventListener("click", (event) => {
    if (event.target === AppDom.qrOverlay) {
      hideQrPanel();
    }
  });
  AppDom.addressInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") performLookup();
  });

  window.addEventListener("resize", () => {
    fitMetaAddressToWidth();
    fitBalanceBtcToWidth();

    if (AppState.currentTxLookup && AppDom.txResultEl.classList.contains("show")) {
      setTxIdDisplay(AppState.currentTxLookup);
      fitTxValueBtcToWidth();
    }
  });

  onLanguageChange(() => {
    if (AppDom.lookupBtn.disabled) {
      AppDom.lookupBtn.textContent = t("loading");
    }

    const refreshAfterLanguageChange = async () => {
      if (getDisplayCurrency() === "BRL") {
        await ensureBrlPriceCached();
      }

      updateBlockHeightTooltip();

      if (AppState.lastAppliedTxData && AppDom.txResultEl.classList.contains("show")) {
        applyTransactionData(AppState.lastAppliedTxData, { silent: true });
      }

      if (AppState.lastAppliedData && AppDom.resultEl.classList.contains("show")) {
        applyAddressData(AppState.lastAppliedData, { silent: true });
      }
    };

    void refreshAfterLanguageChange();
  });
}

initApp();
bindAppEvents();