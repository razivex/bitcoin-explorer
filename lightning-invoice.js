function hideInvoiceOverlay() {
  if (!AppDom.invoiceOverlay) return;
  AppDom.invoiceOverlay.hidden = true;
  AppDom.invoiceOverlay.setAttribute("aria-hidden", "true");
  if (AppDom.invoiceErrorEl) {
    AppDom.invoiceErrorEl.textContent = "";
    AppDom.invoiceErrorEl.hidden = true;
  }
}

function showInvoiceError(message) {
  if (!AppDom.invoiceErrorEl) {
    showError(message);
    return;
  }
  AppDom.invoiceErrorEl.textContent = message;
  AppDom.invoiceErrorEl.hidden = false;
}

function clearInvoiceError() {
  if (!AppDom.invoiceErrorEl) return;
  AppDom.invoiceErrorEl.textContent = "";
  AppDom.invoiceErrorEl.hidden = true;
}

function openInvoiceOverlay() {
  hideActionMenu();
  hideQrPanel();

  const addressData = AppState.currentLnAddress;
  if (!addressData || addressData.kind !== "address") {
    showError(t("errorLnInvoiceNoAddress"));
    return;
  }

  clearInvoiceError();

  if (AppDom.invoiceAddressEl) {
    AppDom.invoiceAddressEl.textContent = addressData.address;
  }

  if (AppDom.invoiceAmountInput) {
    AppDom.invoiceAmountInput.value = "";
    AppDom.invoiceAmountInput.min = String(Math.max(1, addressData.minSats || 1));
    if (addressData.maxSats !== null) {
      AppDom.invoiceAmountInput.max = String(addressData.maxSats);
    } else {
      AppDom.invoiceAmountInput.removeAttribute("max");
    }
  }

  if (AppDom.invoiceAmountHintEl) {
    const maxText =
      addressData.maxSats === null
        ? t("na")
        : formatSatsLabel(addressData.maxSats);
    AppDom.invoiceAmountHintEl.textContent = t("lnInvoiceAmountHint", {
      min: formatSatsLabel(addressData.minSats),
      max: maxText,
    });
  }

  const commentAllowed = Number(addressData.commentAllowed) || 0;
  if (AppDom.invoiceCommentRowEl) {
    AppDom.invoiceCommentRowEl.hidden = commentAllowed <= 0;
  }
  if (AppDom.invoiceCommentInput) {
    AppDom.invoiceCommentInput.value = "";
    AppDom.invoiceCommentInput.maxLength = Math.max(0, commentAllowed);
  }

  AppDom.invoiceOverlay.hidden = false;
  AppDom.invoiceOverlay.setAttribute("aria-hidden", "false");
  AppDom.invoiceAmountInput?.focus();
}

function buildLnurlCallbackUrl(callback, amountMsat, comment) {
  const url = new URL(callback);
  url.searchParams.set("amount", String(amountMsat));
  if (comment) {
    url.searchParams.set("comment", comment);
  }
  return url.toString();
}

/**
 * Parse a required whole-satoshi amount from the invoice form.
 * LNURL-pay always needs a concrete amount to mint a one-time bolt11 invoice.
 * @returns {number} Whole sats
 */
function parseInvoiceAmountInput(rawValue) {
  const text = String(rawValue ?? "").trim();
  if (text === "") {
    throw new Error("invalid-amount");
  }

  // Reject non-integers (e.g. "12.5", "1e3") and non-numeric strings.
  if (!/^\d+$/.test(text)) {
    throw new Error("invalid-amount");
  }

  const amount = Number(text);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("invalid-amount");
  }
  return amount;
}

async function requestBolt11Invoice(addressData, amountSats, comment = "") {
  const minSats = Math.max(0, Number(addressData.minSats) || 0);
  const maxSats =
    addressData.maxSats === null || addressData.maxSats === undefined
      ? null
      : Number(addressData.maxSats);
  const amount = Number(amountSats);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error("invalid-amount");
  }
  if (amount < minSats) {
    throw new Error("amount-too-low");
  }
  if (maxSats !== null && Number.isFinite(maxSats) && amount > maxSats) {
    throw new Error("amount-too-high");
  }

  const commentAllowed = Number(addressData.commentAllowed) || 0;
  const trimmedComment = String(comment || "").trim();
  if (trimmedComment && commentAllowed <= 0) {
    throw new Error("comment-not-allowed");
  }
  if (trimmedComment.length > commentAllowed) {
    throw new Error("comment-too-long");
  }

  const amountMsat = satsToMsat(amount);
  const requestUrl = buildLnurlCallbackUrl(
    addressData.callback,
    amountMsat,
    trimmedComment || undefined,
  );

  const response = await fetchWithTimeout(requestUrl, {}, 15000);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data?.status === "ERROR") {
    throw new Error(data.reason || "invoice-error");
  }

  const invoice = String(data?.pr || data?.payment_request || "").trim();
  if (!invoice || !isValidBolt11Invoice(invoice)) {
    throw new Error("invalid-invoice");
  }

  return invoice;
}

async function generateLightningInvoice() {
  const addressData = AppState.currentLnAddress;
  if (!addressData || addressData.kind !== "address") {
    showInvoiceError(t("errorLnInvoiceNoAddress"));
    return;
  }

  clearInvoiceError();

  let amountSats;
  try {
    amountSats = parseInvoiceAmountInput(AppDom.invoiceAmountInput?.value);
  } catch (err) {
    showInvoiceError(mapInvoiceError(err));
    return;
  }

  const comment = AppDom.invoiceCommentInput?.value || "";

  const generateBtn = AppDom.invoiceGenerateBtn;
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.textContent = t("loading");
  }

  try {
    const invoice = await requestBolt11Invoice(
      addressData,
      amountSats,
      comment,
    );
    hideInvoiceOverlay();
    await showQrCode(invoice, {
      showCopy: true,
      ariaLabel: t("lnInvoiceQrLabel"),
    });
  } catch (err) {
    console.error(err);
    const message = mapInvoiceError(err);
    showInvoiceError(message);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.textContent = t("lnInvoiceGenerate");
    }
  }
}

function mapInvoiceError(err) {
  const code = err?.message || "";
  if (code === "invalid-amount") return t("errorLnInvoiceAmount");
  if (code === "amount-too-low") return t("errorLnInvoiceAmountLow");
  if (code === "amount-too-high") return t("errorLnInvoiceAmountHigh");
  if (code === "comment-not-allowed") return t("errorLnInvoiceComment");
  if (code === "comment-too-long") return t("errorLnInvoiceCommentLong");
  if (code === "invalid-invoice") return t("errorLnInvoiceInvalid");
  if (typeof code === "string" && code.startsWith("HTTP")) {
    return t("errorLnInvoiceFetch");
  }
  // Provider-specific reason strings
  if (
    typeof code === "string" &&
    code.length > 0 &&
    !code.includes("Failed to fetch") &&
    code !== "Failed to fetch"
  ) {
    return code;
  }
  return t("errorLnInvoiceFetch");
}

function bindInvoiceOverlayEvents() {
  if (!AppDom.invoiceOverlay) return;

  AppDom.invoiceCancelBtn?.addEventListener("click", () => {
    hideInvoiceOverlay();
  });

  AppDom.invoiceGenerateBtn?.addEventListener("click", () => {
    void generateLightningInvoice();
  });

  AppDom.invoiceAmountInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void generateLightningInvoice();
    }
  });

  AppDom.invoiceCommentInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void generateLightningInvoice();
    }
  });

  AppDom.invoiceOverlay.addEventListener("click", (event) => {
    if (event.target === AppDom.invoiceOverlay) {
      hideInvoiceOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && AppDom.invoiceOverlay && !AppDom.invoiceOverlay.hidden) {
      hideInvoiceOverlay();
    }
  });
}

window.hideInvoiceOverlay = hideInvoiceOverlay;
window.openInvoiceOverlay = openInvoiceOverlay;
window.generateLightningInvoice = generateLightningInvoice;
window.bindInvoiceOverlayEvents = bindInvoiceOverlayEvents;
window.requestBolt11Invoice = requestBolt11Invoice;
