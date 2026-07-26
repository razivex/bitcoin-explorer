let qrCopyResetTimer = null;
let qrCopyPayload = "";

function getQrSize() {
  const styles = getComputedStyle(AppDom.cardEl);
  const horizontalPadding =
    parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
  const cardContentWidth = AppDom.cardEl.clientWidth - horizontalPadding;

  return Math.floor(Math.min(cardContentWidth, window.innerWidth - 96));
}

function resetQrCopyButtonLabel() {
  if (qrCopyResetTimer !== null) {
    clearTimeout(qrCopyResetTimer);
    qrCopyResetTimer = null;
  }
  if (AppDom.qrCopyBtnLabel) {
    AppDom.qrCopyBtnLabel.textContent = t("qrCopyInvoice");
  }
  if (AppDom.qrCopyBtn) {
    AppDom.qrCopyBtn.setAttribute("aria-label", t("qrCopyInvoice"));
    AppDom.qrCopyBtn.classList.remove("is-copied");
  }
}

function hideQrCopyBar() {
  qrCopyPayload = "";
  resetQrCopyButtonLabel();
  if (AppDom.qrCopyBarEl) {
    AppDom.qrCopyBarEl.hidden = true;
  }
  if (AppDom.qrModalEl) {
    AppDom.qrModalEl.classList.remove("qr-modal--with-copy");
  }
}

function showQrCopyBar(payload) {
  qrCopyPayload = String(payload || "");
  resetQrCopyButtonLabel();
  if (AppDom.qrCopyBarEl) {
    AppDom.qrCopyBarEl.hidden = false;
  }
  if (AppDom.qrModalEl) {
    AppDom.qrModalEl.classList.add("qr-modal--with-copy");
  }
}

function hideQrPanel() {
  AppDom.qrOverlay.hidden = true;
  hideQrCopyBar();
}

async function copyQrPayload() {
  if (!qrCopyPayload) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(qrCopyPayload);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = qrCopyPayload;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (AppDom.qrCopyBtnLabel) {
      AppDom.qrCopyBtnLabel.textContent = t("qrCopied");
    }
    if (AppDom.qrCopyBtn) {
      AppDom.qrCopyBtn.setAttribute("aria-label", t("qrCopied"));
      AppDom.qrCopyBtn.classList.add("is-copied");
    }

    if (qrCopyResetTimer !== null) {
      clearTimeout(qrCopyResetTimer);
    }
    qrCopyResetTimer = setTimeout(() => {
      resetQrCopyButtonLabel();
    }, 1600);
  } catch (err) {
    console.error(err);
    showError(t("errorQrGenerate"));
  }
}

/**
 * @param {string} [payload] Value to encode. Defaults to the current lookup input.
 * @param {{ showCopy?: boolean, ariaLabel?: string }} [options]
 */
async function showQrCode(payload, options = {}) {
  hideActionMenu();

  const value =
    payload === undefined || payload === null
      ? AppState.currentLookupInput
      : String(payload);

  if (!value || !AppDom.qrOverlay.hidden) return;

  if (typeof QRCode === "undefined") {
    showError(t("errorQrLibrary"));
    return;
  }

  try {
    const qrSize = getQrSize();
    await QRCode.toCanvas(AppDom.qrCanvas, value, {
      width: qrSize,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    if (AppDom.qrCanvas && options.ariaLabel) {
      AppDom.qrCanvas.setAttribute("aria-label", options.ariaLabel);
    } else if (AppDom.qrCanvas) {
      AppDom.qrCanvas.setAttribute("aria-label", t("qrCanvasLabel"));
    }

    if (options.showCopy) {
      showQrCopyBar(value);
    } else {
      hideQrCopyBar();
    }

    AppDom.qrOverlay.hidden = false;
  } catch (err) {
    console.error(err);
    showError(t("errorQrGenerate"));
  }
}

function bindQrEvents() {
  AppDom.qrCopyBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    void copyQrPayload();
  });
}

window.getQrSize = getQrSize;
window.hideQrPanel = hideQrPanel;
window.showQrCode = showQrCode;
window.bindQrEvents = bindQrEvents;
window.copyQrPayload = copyQrPayload;
