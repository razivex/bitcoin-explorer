function getLightningChannelStatusLabel(status) {
  const value = Number(status);
  if (value === 1) return t("lnChannelStatusOpen");
  if (value === 2 || value === 3) return t("lnChannelStatusClosed");
  return t("unknown");
}

function formatLightningNodeLabel(node) {
  if (!node) return t("na");
  const alias = String(node.alias || "").trim();
  const pubKey = String(node.public_key || "").trim();
  if (alias && pubKey) return `${alias} (${truncateMiddle(pubKey, 18)})`;
  if (alias) return alias;
  if (pubKey) return truncateMiddle(pubKey, 22);
  return t("na");
}

function formatSatsLabel(sats) {
  const value = Number(sats);
  if (!Number.isFinite(value)) return t("na");
  return `${value.toLocaleString(getLocale())} ${t("unitSats")}`;
}

function formatCapacityLabel(capacitySats) {
  const sats = Number(capacitySats);
  if (!Number.isFinite(sats)) return t("na");
  const btc = satsToBtc(sats);
  return `${formatBtc(btc)} BTC (${formatSatsLabel(sats)})`;
}

function formatOptionalDate(value) {
  if (value === null || value === undefined || value === "") return t("na");

  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return t("na");
    // Mempool sometimes returns unix seconds, sometimes ms.
    const ms = seconds > 1e12 ? seconds : seconds * 1000;
    return formatDateTime(new Date(ms));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("na");
  return formatDateTime(date);
}

async function fetchLightningChannel(channelId) {
  const encoded = encodeURIComponent(channelId);
  return fetchMempoolOnlyJson(`/v1/lightning/channels/${encoded}`, {
    validate: (data) => data && (data.id || data.short_id),
  });
}

async function fetchLnurlPayInfo(lnurlpUrl) {
  const response = await fetchWithTimeout(lnurlpUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data?.status === "ERROR") {
    throw new Error(data.reason || "LNURL pay error");
  }
  if (!isValidLnurlPayResponse(data)) {
    throw new Error("Invalid LNURL pay response");
  }
  return data;
}

async function loadLightningChannelData(input) {
  const channelId = resolveLightningChannelId(input);
  const channel = await fetchLightningChannel(channelId);

  const shortId =
    channel.short_id ||
    (channel.id ? longChannelIdToShortId(channel.id) : channelId);
  const capacitySats = Number(channel.capacity);
  const capacityBtc = Number.isFinite(capacitySats)
    ? satsToBtc(capacitySats)
    : null;

  return {
    kind: "channel",
    input: String(input).trim(),
    channelId: String(channel.id || channelId),
    shortId,
    capacitySats: Number.isFinite(capacitySats) ? capacitySats : null,
    capacityBtc,
    status: channel.status,
    statusLabel: getLightningChannelStatusLabel(channel.status),
    createdAt: channel.created ?? null,
    updatedAt: channel.updated_at ?? null,
    closingDate: channel.closing_date ?? null,
    fundingTxid: channel.transaction_id ?? null,
    fundingVout: channel.transaction_vout,
    closingTxid: channel.closing_transaction_id ?? null,
    nodeLeft: channel.node_left ?? null,
    nodeRight: channel.node_right ?? null,
  };
}

async function loadLightningAddressData(input) {
  const parsed = parseLightningAddress(input);
  const payInfo = await fetchLnurlPayInfo(parsed.lnurlpUrl);
  const metadata = parseLnurlMetadata(payInfo.metadata);

  const minSendableMsat = Number(payInfo.minSendable) || 0;
  const maxSendableMsat = Number(payInfo.maxSendable) || 0;
  const minSats = msatToSats(minSendableMsat) ?? 0;
  const maxSats =
    maxSendableMsat > 0 ? msatToSats(maxSendableMsat) : null;

  return {
    kind: "address",
    address: parsed.address,
    username: parsed.username,
    domain: parsed.domain,
    lnurlpUrl: parsed.lnurlpUrl,
    callback: payInfo.callback,
    description: metadata.description || "",
    identifier: metadata.identifier || parsed.address,
    minSendableMsat,
    maxSendableMsat,
    minSats,
    maxSats,
    commentAllowed: Number(payInfo.commentAllowed) || 0,
    rawPayInfo: payInfo,
  };
}

function hideLightningResults() {
  AppDom.lnAddressResultEl?.classList.remove("show");
  AppDom.lnChannelResultEl?.classList.remove("show");
  AppDom.lnInvoiceResultEl?.classList.remove("show");
}

async function loadLightningInvoiceData(input) {
  const data = await decodeBolt11Invoice(input);
  // Refresh expiry state at load time.
  data.expired = Date.now() > data.expiresAt.getTime();
  return data;
}

function formatInvoiceAmountLabel(data) {
  if (data.amountSats === null || data.amountSats === undefined) {
    return t("lnInvoiceAnyAmount");
  }
  const btc =
    data.amountSats !== null ? satsToBtc(data.amountSats) : null;
  if (btc === null) return t("na");
  return `${formatBtc(btc)} BTC (${formatSatsLabel(data.amountSats)})`;
}

function formatInvoiceHeroAmount(data) {
  if (data.amountSats === null || data.amountSats === undefined) {
    return t("lnInvoiceAnyAmount");
  }
  return `${formatBtc(satsToBtc(data.amountSats))} BTC`;
}

function applyLightningChannelData(data, { silent = false } = {}) {
  AppState.currentNetwork = "lightning";
  AppState.lastAppliedLnData = data;
  AppState.currentLookupInput = data.shortId || data.channelId;
  AppState.currentLnAddress = null;

  AppDom.resultEl.classList.remove("show");
  AppDom.txResultEl.classList.remove("show");
  AppDom.lnAddressResultEl.classList.remove("show");
  AppDom.lnInvoiceResultEl?.classList.remove("show");

  AppDom.lnChannelCapacityEl.textContent =
    data.capacityBtc === null
      ? t("na")
      : `${formatBtc(data.capacityBtc)} BTC`;
  scheduleLnChannelCapacityFit();

  AppDom.lnChannelStatusEl.textContent = data.statusLabel;
  AppDom.lnChannelStatusEl.classList.toggle(
    "ln-status--open",
    Number(data.status) === 1,
  );
  AppDom.lnChannelStatusEl.classList.toggle(
    "ln-status--closed",
    Number(data.status) !== 1,
  );

  setTruncatableField(AppDom.lnChannelShortIdEl, data.shortId);
  setTruncatableField(AppDom.lnChannelFullIdEl, data.channelId);
  AppDom.lnChannelNetworkEl.textContent = t("networkLightning");
  AppDom.lnChannelCapacityMetaEl.textContent =
    data.capacitySats === null ? t("na") : formatSatsLabel(data.capacitySats);
  AppDom.lnChannelCreatedEl.textContent = formatOptionalDate(data.createdAt);
  AppDom.lnChannelUpdatedEl.textContent = formatOptionalDate(data.updatedAt);
  AppDom.lnChannelNodeLeftEl.textContent = formatLightningNodeLabel(
    data.nodeLeft,
  );
  AppDom.lnChannelNodeLeftEl.title = data.nodeLeft?.public_key || "";
  AppDom.lnChannelNodeRightEl.textContent = formatLightningNodeLabel(
    data.nodeRight,
  );
  AppDom.lnChannelNodeRightEl.title = data.nodeRight?.public_key || "";
  setChannelTxLookupField(AppDom.lnChannelFundingTxEl, data.fundingTxid);
  setChannelTxLookupField(AppDom.lnChannelClosingTxEl, data.closingTxid);

  if (!silent) {
    // Keep parity with other lookups for focus/visibility.
  }

  AppDom.lnChannelResultEl.classList.add("show");
}

/**
 * Render a channel funding/closing txid as an in-app lookup link when valid.
 * Clicking fills the search box and runs the transaction lookup.
 */
function setChannelTxLookupField(el, txid) {
  if (!el) return;

  const raw = txid == null ? "" : String(txid).trim();
  const isTx = Boolean(raw) && isValidTxid(raw);

  if (!isTx) {
    clearChannelTxLookupLink(el);
    setTruncatableField(el, raw || t("na"));
    return;
  }

  const normalized = raw.toLowerCase();
  setTruncatableField(el, normalized);
  el.dataset.lookupValue = normalized;
  el.classList.add("meta__lookup-link");
  el.setAttribute("role", "link");
  el.tabIndex = 0;
}

function clearChannelTxLookupLink(el) {
  if (!el) return;
  delete el.dataset.lookupValue;
  el.classList.remove("meta__lookup-link");
  el.removeAttribute("role");
  el.removeAttribute("tabindex");
}

function bindLightningChannelTxLinks() {
  const root = AppDom.lnChannelResultEl;
  if (!root || root.dataset.txLinksBound === "1") return;
  root.dataset.txLinksBound = "1";

  const activate = (event) => {
    const target = event.target?.closest?.(".meta__lookup-link");
    if (!target || !root.contains(target)) return;

    const value = target.dataset.lookupValue || target.dataset.fullValue;
    if (!value || !isValidTxid(value)) return;

    event.preventDefault();
    const backTo =
      typeof getChannelBackTarget === "function" ? getChannelBackTarget() : null;
    navigateToSearch(value, backTo ? { backTo } : undefined);
  };

  root.addEventListener("click", activate);
  root.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target?.closest?.(".meta__lookup-link");
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    activate(event);
  });
}

function applyLightningInvoiceData(data, { silent = false } = {}) {
  AppState.currentNetwork = "lightning";
  AppState.lastAppliedLnData = data;
  AppState.currentLookupInput = data.invoice;
  AppState.currentLnAddress = null;

  // Recompute expired on each render (language refresh / re-apply).
  data.expired = Date.now() > data.expiresAt.getTime();

  AppDom.resultEl.classList.remove("show");
  AppDom.txResultEl.classList.remove("show");
  AppDom.lnAddressResultEl?.classList.remove("show");
  AppDom.lnChannelResultEl?.classList.remove("show");

  if (AppDom.lnInvoiceAmountEl) {
    AppDom.lnInvoiceAmountEl.textContent = formatInvoiceHeroAmount(data);
    scheduleLnInvoiceAmountFit();
  }

  if (AppDom.lnInvoiceStatusEl) {
    AppDom.lnInvoiceStatusEl.textContent = data.expired
      ? t("lnInvoiceStatusExpired")
      : t("lnInvoiceStatusValid");
    AppDom.lnInvoiceStatusEl.classList.toggle(
      "ln-status--closed",
      Boolean(data.expired),
    );
    AppDom.lnInvoiceStatusEl.classList.toggle(
      "ln-status--open",
      !data.expired,
    );
  }

  setTruncatableField(AppDom.lnInvoiceValueEl, data.invoice);

  if (AppDom.lnInvoiceNetworkEl) {
    AppDom.lnInvoiceNetworkEl.textContent = t("networkLightning");
  }
  if (AppDom.lnInvoiceAmountMetaEl) {
    AppDom.lnInvoiceAmountMetaEl.textContent = formatInvoiceAmountLabel(data);
  }
  if (AppDom.lnInvoiceDescriptionEl) {
    if (data.description) {
      AppDom.lnInvoiceDescriptionEl.textContent = data.description;
      AppDom.lnInvoiceDescriptionEl.title = data.description;
    } else if (data.descriptionHash) {
      AppDom.lnInvoiceDescriptionEl.textContent = t("lnInvoiceNoDescription");
      AppDom.lnInvoiceDescriptionEl.title = data.descriptionHash;
    } else {
      AppDom.lnInvoiceDescriptionEl.textContent = t("lnInvoiceNoDescription");
      AppDom.lnInvoiceDescriptionEl.title = "";
    }
  }

  const destination = data.payeeNodeKey || "";
  setTruncatableField(
    AppDom.lnInvoiceDestinationEl,
    destination || t("na"),
  );
  if (AppDom.lnInvoiceDestinationEl) {
    AppDom.lnInvoiceDestinationEl.title = destination || "";
  }

  setTruncatableField(
    AppDom.lnInvoicePaymentHashEl,
    data.paymentHash || t("na"),
  );

  if (AppDom.lnInvoiceCreatedEl) {
    AppDom.lnInvoiceCreatedEl.textContent = formatDateTime(data.createdAt);
  }
  if (AppDom.lnInvoiceExpiresEl) {
    AppDom.lnInvoiceExpiresEl.textContent = formatDateTime(data.expiresAt);
  }

  if (!silent) {
    // Local decode only — nothing to poll.
  }

  AppDom.lnInvoiceResultEl?.classList.add("show");
}

function applyLightningAddressData(data, { silent = false } = {}) {
  AppState.currentNetwork = "lightning";
  AppState.lastAppliedLnData = data;
  AppState.currentLookupInput = data.address;
  AppState.currentLnAddress = data;

  AppDom.resultEl.classList.remove("show");
  AppDom.txResultEl.classList.remove("show");
  AppDom.lnChannelResultEl.classList.remove("show");
  AppDom.lnInvoiceResultEl?.classList.remove("show");

  setLnAddressTitleDisplay(data.address);

  AppDom.lnAddressDescriptionEl.textContent =
    data.description || t("lnNoDescription");
  setTruncatableField(AppDom.lnAddressValueEl, data.address);
  AppDom.lnAddressNetworkEl.textContent = t("networkLightning");
  AppDom.lnAddressDomainEl.textContent = data.domain;
  AppDom.lnAddressMinEl.textContent = formatSatsLabel(data.minSats);
  AppDom.lnAddressMaxEl.textContent =
    data.maxSats === null ? t("na") : formatSatsLabel(data.maxSats);
  AppDom.lnAddressCommentEl.textContent =
    data.commentAllowed > 0
      ? t("lnCommentAllowed", { max: String(data.commentAllowed) })
      : t("no");

  if (!silent) {
    // No auto-refresh for LNURL pay endpoints (rate limits / CORS).
  }

  AppDom.lnAddressResultEl.classList.add("show");
  scheduleLnAddressTitleFit();
}

function setTruncatableField(el, fullValue) {
  if (!el) return;
  const value = fullValue == null ? "" : String(fullValue);
  el.dataset.fullValue = value;
  el.title = value;
  el.textContent = value;

  requestAnimationFrame(() => {
    fitTruncatableField(el);
  });
}

function fitTruncatableField(el) {
  const fullValue = el?.dataset?.fullValue;
  if (!fullValue || !el.offsetParent) return;

  el.textContent = fullValue;
  if (el.clientWidth === 0) return;
  if (el.scrollWidth <= el.clientWidth) return;

  for (let len = fullValue.length - 1; len >= 12; len -= 1) {
    el.textContent = truncateMiddle(fullValue, len);
    if (el.scrollWidth <= el.clientWidth) return;
  }

  el.textContent = truncateMiddle(fullValue, 12);
}

function setLnAddressTitleDisplay(fullAddress) {
  if (!AppDom.lnAddressTitleEl) return;
  const value = fullAddress == null ? "" : String(fullAddress);
  AppDom.lnAddressTitleEl.dataset.fullAddress = value;
  AppDom.lnAddressTitleEl.title = value;
  AppDom.lnAddressTitleEl.textContent = value;
}

function fitLnAddressTitleToWidth() {
  const el = AppDom.lnAddressTitleEl;
  if (!el || !AppDom.lnAddressResultEl?.classList.contains("show")) {
    return;
  }

  const full =
    el.dataset.fullAddress ||
    AppState.currentLnAddress?.address ||
    el.textContent ||
    "";
  if (!full) return;

  el.textContent = full;
  el.style.fontSize = `${AppConstants.BALANCE_BTC_MAX_FONT_PX}px`;

  // Force single-line measurement even if CSS was overridden.
  el.style.whiteSpace = "nowrap";
  el.style.overflow = "hidden";

  if (el.clientWidth === 0) return;

  const minFont =
    AppConstants.LN_ADDRESS_TITLE_MIN_FONT_PX ??
    AppConstants.BALANCE_BTC_MIN_FONT_PX;

  let fontSize = AppConstants.BALANCE_BTC_MAX_FONT_PX;
  while (fontSize > minFont && el.scrollWidth > el.clientWidth) {
    fontSize -= 1;
    el.style.fontSize = `${fontSize}px`;
  }

  // If still too wide at the minimum font size, middle-truncate so it stays
  // on one row without wrapping or clipping silently.
  if (el.scrollWidth > el.clientWidth) {
    for (let len = full.length - 1; len >= 12; len -= 1) {
      el.textContent = truncateMiddle(full, len);
      if (el.scrollWidth <= el.clientWidth) {
        return;
      }
    }
    el.textContent = truncateMiddle(full, 12);
  }
}

function scheduleLnAddressTitleFit() {
  // Two frames: first after the result panel is shown, second after layout.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fitLnAddressTitleToWidth();
    });
  });
}

function fitLnChannelCapacityToWidth() {
  if (
    !AppDom.lnChannelCapacityEl ||
    !AppDom.lnChannelResultEl.classList.contains("show")
  ) {
    return;
  }

  AppDom.lnChannelCapacityEl.style.fontSize = `${AppConstants.BALANCE_BTC_MAX_FONT_PX}px`;
  if (AppDom.lnChannelCapacityEl.clientWidth === 0) return;

  let fontSize = AppConstants.BALANCE_BTC_MAX_FONT_PX;
  while (
    fontSize > AppConstants.BALANCE_BTC_MIN_FONT_PX &&
    AppDom.lnChannelCapacityEl.scrollWidth >
      AppDom.lnChannelCapacityEl.clientWidth
  ) {
    fontSize -= 1;
    AppDom.lnChannelCapacityEl.style.fontSize = `${fontSize}px`;
  }
}

function scheduleLnChannelCapacityFit() {
  requestAnimationFrame(() => {
    fitLnChannelCapacityToWidth();
  });
}

function fitLnInvoiceAmountToWidth() {
  if (
    !AppDom.lnInvoiceAmountEl ||
    !AppDom.lnInvoiceResultEl?.classList.contains("show")
  ) {
    return;
  }

  AppDom.lnInvoiceAmountEl.style.fontSize = `${AppConstants.BALANCE_BTC_MAX_FONT_PX}px`;
  if (AppDom.lnInvoiceAmountEl.clientWidth === 0) return;

  let fontSize = AppConstants.BALANCE_BTC_MAX_FONT_PX;
  while (
    fontSize > AppConstants.BALANCE_BTC_MIN_FONT_PX &&
    AppDom.lnInvoiceAmountEl.scrollWidth > AppDom.lnInvoiceAmountEl.clientWidth
  ) {
    fontSize -= 1;
    AppDom.lnInvoiceAmountEl.style.fontSize = `${fontSize}px`;
  }
}

function scheduleLnInvoiceAmountFit() {
  requestAnimationFrame(() => {
    fitLnInvoiceAmountToWidth();
  });
}

function refitLightningTruncatableFields() {
  document
    .querySelectorAll(
      "#lnAddressResult .meta__address, #lnChannelResult .meta__address, #lnInvoiceResult .meta__address",
    )
    .forEach((el) => fitTruncatableField(el));
  fitLnAddressTitleToWidth();
  fitLnChannelCapacityToWidth();
  fitLnInvoiceAmountToWidth();
}

window.getLightningChannelStatusLabel = getLightningChannelStatusLabel;
window.formatLightningNodeLabel = formatLightningNodeLabel;
window.formatSatsLabel = formatSatsLabel;
window.formatCapacityLabel = formatCapacityLabel;
window.loadLightningChannelData = loadLightningChannelData;
window.loadLightningAddressData = loadLightningAddressData;
window.loadLightningInvoiceData = loadLightningInvoiceData;
window.hideLightningResults = hideLightningResults;
window.applyLightningChannelData = applyLightningChannelData;
window.applyLightningAddressData = applyLightningAddressData;
window.applyLightningInvoiceData = applyLightningInvoiceData;
window.fitLnAddressTitleToWidth = fitLnAddressTitleToWidth;
window.fitLnChannelCapacityToWidth = fitLnChannelCapacityToWidth;
window.fitLnInvoiceAmountToWidth = fitLnInvoiceAmountToWidth;
window.refitLightningTruncatableFields = refitLightningTruncatableFields;
window.bindLightningChannelTxLinks = bindLightningChannelTxLinks;
