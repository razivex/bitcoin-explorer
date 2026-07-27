function initApp() {
  loadCachedMarketMetrics();
  startBlockHeightRefresh();
  startMarketMetricsRefresh();
}

function bindAppEvents() {
  AppDom.lookupBtn.addEventListener("click", () => performLookup());
  AppDom.homeLogoLink?.addEventListener("click", (event) => {
    if (typeof goToHome === "function") {
      goToHome(event);
    }
  });
  bindActionMenuEvents();
  bindInvoiceOverlayEvents();
  bindQrEvents();
  if (typeof bindLightningChannelTxLinks === "function") {
    bindLightningChannelTxLinks();
  }
  AppDom.txBackBtn?.addEventListener("click", () => {
    if (typeof goBackFromTransaction === "function") {
      goBackFromTransaction();
    }
  });
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
    refitLightningTruncatableFields();

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

      if (
        AppState.lastAppliedLnData?.kind === "channel" &&
        AppDom.lnChannelResultEl?.classList.contains("show")
      ) {
        applyLightningChannelData(AppState.lastAppliedLnData, { silent: true });
      }

      if (
        AppState.lastAppliedLnData?.kind === "address" &&
        AppDom.lnAddressResultEl?.classList.contains("show")
      ) {
        applyLightningAddressData(AppState.lastAppliedLnData, { silent: true });
      }

      if (
        AppState.lastAppliedLnData?.kind === "invoice" &&
        AppDom.lnInvoiceResultEl?.classList.contains("show")
      ) {
        applyLightningInvoiceData(AppState.lastAppliedLnData, { silent: true });
      }

      if (AppDom.invoiceGenerateBtn && !AppDom.invoiceGenerateBtn.disabled) {
        AppDom.invoiceGenerateBtn.textContent = t("lnInvoiceGenerate");
      }
    };

    void refreshAfterLanguageChange();
  });
}

initApp();
bindAppEvents();