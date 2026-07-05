function hideActionMenu() {
  if (!AppDom.actionMenu) return;
  AppDom.actionMenu.hidden = true;
  AppDom.actionMenuBtn.setAttribute("aria-expanded", "false");
}

function toggleActionMenu() {
  if (!AppDom.actionMenu || !AppState.currentLookupInput) return;

  const willOpen = AppDom.actionMenu.hidden;
  if (willOpen) {
    AppDom.actionMenu.hidden = false;
    AppDom.actionMenuBtn.setAttribute("aria-expanded", "true");
  } else {
    hideActionMenu();
  }
}

function bindActionMenuEvents() {
  AppDom.actionMenuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleActionMenu();
  });

  document.addEventListener("click", (event) => {
    if (
      AppDom.actionMenu &&
      !AppDom.actionMenu.hidden &&
      !event.target.closest(".action-menu")
    ) {
      hideActionMenu();
    }
  });

  AppDom.actionQrBtn.addEventListener("click", () => {
    hideActionMenu();
    showQrCode();
  });

  AppDom.actionExportBtn.addEventListener("click", () => {
    hideActionMenu();
    void exportAddressTransactions();
  });
}

window.hideActionMenu = hideActionMenu;
window.toggleActionMenu = toggleActionMenu;
window.bindActionMenuEvents = bindActionMenuEvents;