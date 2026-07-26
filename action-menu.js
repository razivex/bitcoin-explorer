function hideActionMenu() {
  if (AppDom.actionMenu) {
    AppDom.actionMenu.hidden = true;
    AppDom.actionMenuBtn?.setAttribute("aria-expanded", "false");
  }
  if (AppDom.lnActionMenu) {
    AppDom.lnActionMenu.hidden = true;
    AppDom.lnActionMenuBtn?.setAttribute("aria-expanded", "false");
  }
}

function toggleActionMenu() {
  if (!AppDom.actionMenu || !AppState.currentLookupInput) return;

  const willOpen = AppDom.actionMenu.hidden;
  hideActionMenu();
  if (willOpen) {
    AppDom.actionMenu.hidden = false;
    AppDom.actionMenuBtn.setAttribute("aria-expanded", "true");
  }
}

function toggleLnActionMenu() {
  if (!AppDom.lnActionMenu || !AppState.currentLnAddress) return;

  const willOpen = AppDom.lnActionMenu.hidden;
  hideActionMenu();
  if (willOpen) {
    AppDom.lnActionMenu.hidden = false;
    AppDom.lnActionMenuBtn.setAttribute("aria-expanded", "true");
  }
}

function bindActionMenuEvents() {
  AppDom.actionMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActionMenu();
  });

  AppDom.lnActionMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLnActionMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".action-menu") &&
      ((AppDom.actionMenu && !AppDom.actionMenu.hidden) ||
        (AppDom.lnActionMenu && !AppDom.lnActionMenu.hidden))
    ) {
      hideActionMenu();
    }
  });

  AppDom.actionQrBtn?.addEventListener("click", () => {
    hideActionMenu();
    void showQrCode();
  });

  AppDom.actionExportBtn?.addEventListener("click", () => {
    hideActionMenu();
    void exportAddressTransactions();
  });

  AppDom.lnActionQrBtn?.addEventListener("click", () => {
    hideActionMenu();
    const address = AppState.currentLnAddress?.address || AppState.currentLookupInput;
    void showQrCode(address);
  });

  AppDom.lnActionInvoiceBtn?.addEventListener("click", () => {
    hideActionMenu();
    openInvoiceOverlay();
  });
}

window.hideActionMenu = hideActionMenu;
window.toggleActionMenu = toggleActionMenu;
window.toggleLnActionMenu = toggleLnActionMenu;
window.bindActionMenuEvents = bindActionMenuEvents;