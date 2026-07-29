let qrCopyResetTimer = null;
let qrCopyPayload = "";

function getQrSize() {
  // Matches .qr-modal width: min(464px, calc(100vw - 48px)).
  // Even pixel size keeps Safari scaling clean for dense Lightning QRs.
  const modalWidth = Math.min(464, Math.max(200, window.innerWidth - 48));
  const size = Math.floor(modalWidth);
  return Math.max(160, size - (size % 2));
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
 * Force the canvas to fill its square wrapper.
 * Safari often mis-sizes canvas with width:100% + height:auto, leaving a white strip.
 */
function fitQrCanvasToWrapper() {
  const canvas = AppDom.qrCanvas;
  if (!canvas) return;

  // Clear library / browser inline sizing so CSS controls display size.
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.maxWidth = "100%";
  canvas.style.maxHeight = "100%";
  canvas.style.display = "block";
  canvas.style.objectFit = "fill";
  canvas.style.aspectRatio = "1 / 1";
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
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Ensure bitmap is square (qrcode usually is, but guard denser payloads).
    if (AppDom.qrCanvas.width !== AppDom.qrCanvas.height) {
      const side = Math.max(AppDom.qrCanvas.width, AppDom.qrCanvas.height);
      AppDom.qrCanvas.width = side;
      AppDom.qrCanvas.height = side;
    }

    fitQrCanvasToWrapper();

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

    // Re-fit after layout so Safari uses the final box size.
    requestAnimationFrame(() => {
      fitQrCanvasToWrapper();
    });
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
