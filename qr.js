function getQrSize() {
  const styles = getComputedStyle(AppDom.cardEl);
  const horizontalPadding =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const modalPadding = 40;
  const cardContentWidth =
    AppDom.cardEl.clientWidth - horizontalPadding - modalPadding;

  return Math.floor(Math.min(cardContentWidth, window.innerWidth - 96));
}

function hideQrPanel() {
  AppDom.qrOverlay.hidden = true;
}

async function showQrCode() {
  if (!AppState.currentLookupInput || !AppDom.qrOverlay.hidden) return;

  if (typeof QRCode === "undefined") {
    showError(t("errorQrLibrary"));
    return;
  }

  try {
    const qrSize = getQrSize();
    await QRCode.toCanvas(AppDom.qrCanvas, AppState.currentLookupInput, {
      width: qrSize,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    AppDom.qrOverlay.hidden = false;
  } catch (err) {
    console.error(err);
    showError(t("errorQrGenerate"));
  }
}

window.getQrSize = getQrSize;
window.hideQrPanel = hideQrPanel;
window.showQrCode = showQrCode;