const NOTIFY_STORAGE_KEY = "bitcoin-explorer-notifications";
const NOTIFY_TYPES = [
  "newBlock",
  "difficultyAdjustment",
  "halving",
  "txConfirmed",
  "addressNewTx",
];

const DEFAULT_NOTIFY_PREFS = {
  newBlock: false,
  difficultyAdjustment: false,
  halving: false,
  txConfirmed: false,
  addressNewTx: false,
};

let notifyPrefs = { ...DEFAULT_NOTIFY_PREFS };
let notifyServiceWorkerPromise = null;

function isNotificationApiAvailable() {
  return typeof window.Notification === "function";
}

function ensureNotifyServiceWorker() {
  if (notifyServiceWorkerPromise) return notifyServiceWorkerPromise;
  if (!("serviceWorker" in navigator)) {
    notifyServiceWorkerPromise = Promise.resolve(null);
    return notifyServiceWorkerPromise;
  }

  notifyServiceWorkerPromise = navigator.serviceWorker
    .register("sw.js")
    .then((registration) => registration)
    .catch((err) => {
      console.error(err);
      return null;
    });
  return notifyServiceWorkerPromise;
}

function loadNotificationPrefs() {
  try {
    const stored = localStorage.getItem(NOTIFY_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_NOTIFY_PREFS };
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_NOTIFY_PREFS };
    }
    const next = { ...DEFAULT_NOTIFY_PREFS };
    for (const type of NOTIFY_TYPES) {
      next[type] = Boolean(parsed[type]);
    }
    // Older builds stored address confirmations separately.
    if (parsed.addressTxConfirmed) {
      next.txConfirmed = true;
    }
    return next;
  } catch (err) {
    console.error(err);
    return { ...DEFAULT_NOTIFY_PREFS };
  }
}

function saveNotificationPrefs(prefs) {
  try {
    localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error(err);
  }
}

function getNotificationPrefs() {
  return { ...notifyPrefs };
}

function isNotificationEnabled(type) {
  return Boolean(notifyPrefs[type]);
}

function anyNotificationEnabled() {
  return NOTIFY_TYPES.some((type) => notifyPrefs[type]);
}

async function ensureNotificationPermission() {
  if (!isNotificationApiAvailable()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function setNotificationEnabled(type, enabled) {
  if (!NOTIFY_TYPES.includes(type)) return false;

  if (enabled) {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      notifyPrefs = { ...notifyPrefs, [type]: false };
      saveNotificationPrefs(notifyPrefs);
      return false;
    }
  }

  notifyPrefs = { ...notifyPrefs, [type]: Boolean(enabled) };
  saveNotificationPrefs(notifyPrefs);

  if (notifyPrefs[type]) {
    showAppNotification({
      title: t("notifyTestTitle"),
      body: t("notifyTestBody"),
      tag: "notify-test",
    });
  }

  return notifyPrefs[type];
}

function shortNotifyId(value, visibleChars = 22) {
  const text = String(value || "");
  if (!text) return "";
  if (typeof truncateMiddle === "function") {
    return truncateMiddle(text, visibleChars);
  }
  if (text.length <= visibleChars) return text;
  return `${text.slice(0, 8)}...${text.slice(-8)}`;
}

function notificationOptions({ body, tag }) {
  return {
    body: body || "",
    tag: tag || undefined,
    // Silent toasts are easy to miss on Windows; show a normal banner.
    silent: false,
    renotify: Boolean(tag),
    icon: "favicon.svg",
  };
}

function showNotificationViaConstructor(title, options) {
  const notification = new Notification(title, options);
  notification.addEventListener("click", () => {
    try {
      window.focus();
    } catch (err) {
      console.error(err);
    }
    notification.close();
  });
}

function showAppNotification({ title, body, tag }) {
  if (!isNotificationApiAvailable()) return;
  if (Notification.permission !== "granted") return;

  const options = notificationOptions({ body, tag });

  void ensureNotifyServiceWorker()
    .then((registration) => {
      if (registration?.showNotification) {
        return registration.showNotification(title, options);
      }
      showNotificationViaConstructor(title, options);
      return undefined;
    })
    .catch((err) => {
      console.error(err);
      try {
        showNotificationViaConstructor(title, options);
      } catch (fallbackErr) {
        console.error(fallbackErr);
      }
    });
}

function formatNotifyHeight(height) {
  if (typeof formatBlockHeight === "function") {
    return formatBlockHeight(height);
  }
  return String(height);
}

function heightCrossedInterval(previousHeight, nextHeight, interval) {
  const prev = Number(previousHeight);
  const next = Number(nextHeight);
  const step = Number(interval);
  if (
    !Number.isFinite(prev) ||
    !Number.isFinite(next) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    next <= prev
  ) {
    return false;
  }
  return Math.floor(next / step) > Math.floor(prev / step);
}

function latestIntervalHeight(height, interval) {
  const next = Number(height);
  const step = Number(interval);
  if (!Number.isFinite(next) || !Number.isFinite(step) || step <= 0) {
    return null;
  }
  return Math.floor(next / step) * step;
}

function subsidyBtcAtHeight(height) {
  const interval = Number(AppConstants?.HALVING_INTERVAL);
  const era = Math.floor(Number(height) / interval);
  if (!Number.isFinite(era) || era < 0) return null;
  return 50 / 2 ** era;
}

function formatNotifySubsidy(subsidyBtc) {
  const value = Number(subsidyBtc);
  if (!Number.isFinite(value)) return "";
  const locale = typeof getLocale === "function" ? getLocale() : undefined;
  return value.toLocaleString(locale, { maximumFractionDigits: 8 });
}

let lastNotifiedDifficultyHeight = null;
let lastNotifiedHalvingHeight = null;

function notifyNewBlock(height) {
  if (!isNotificationEnabled("newBlock")) return;
  showAppNotification({
    title: t("notifyNewBlock"),
    body: t("notifyBodyBlock", { height: formatNotifyHeight(height) }),
    tag: `block-${height}`,
  });
}

function notifyDifficultyAdjustment(height) {
  if (!isNotificationEnabled("difficultyAdjustment")) return;
  const retargetHeight = Number(height);
  if (!Number.isFinite(retargetHeight) || retargetHeight <= 0) return;
  if (lastNotifiedDifficultyHeight === retargetHeight) return;
  lastNotifiedDifficultyHeight = retargetHeight;
  showAppNotification({
    title: t("notifyDifficulty"),
    body: t("notifyBodyDifficulty", {
      height: formatNotifyHeight(retargetHeight),
    }),
    tag: `difficulty-${retargetHeight}`,
  });
}

function notifyHalving(height) {
  if (!isNotificationEnabled("halving")) return;
  const halvingHeight = Number(height);
  if (!Number.isFinite(halvingHeight) || halvingHeight <= 0) return;
  if (lastNotifiedHalvingHeight === halvingHeight) return;
  lastNotifiedHalvingHeight = halvingHeight;
  const subsidy = subsidyBtcAtHeight(halvingHeight);
  showAppNotification({
    title: t("notifyHalving"),
    body: t("notifyBodyHalving", {
      height: formatNotifyHeight(halvingHeight),
      subsidy: formatNotifySubsidy(subsidy),
    }),
    tag: `halving-${halvingHeight}`,
  });
}

function onBlockHeightAdvanced(previousHeight, nextHeight) {
  notifyNewBlock(nextHeight);

  const difficultyInterval = Number(
    AppConstants?.DIFFICULTY_ADJUSTMENT_INTERVAL,
  );
  if (heightCrossedInterval(previousHeight, nextHeight, difficultyInterval)) {
    notifyDifficultyAdjustment(
      latestIntervalHeight(nextHeight, difficultyInterval),
    );
  }

  const halvingInterval = Number(AppConstants?.HALVING_INTERVAL);
  if (heightCrossedInterval(previousHeight, nextHeight, halvingInterval)) {
    notifyHalving(latestIntervalHeight(nextHeight, halvingInterval));
  }
}

function notifyTxConfirmed(data) {
  if (!isNotificationEnabled("txConfirmed")) return;
  const txid = data?.txid || AppState.currentTxLookup;
  if (!txid) return;
  showAppNotification({
    title: t("notifyTxConfirmed"),
    body: t("notifyBodyTx", { txid: shortNotifyId(txid) }),
    tag: `tx-confirmed-${txid}`,
  });
}

function isSilentPaymentData(data) {
  return Boolean(data?.silentPayment || data?.lookupMode === "silent");
}

function notifyAddressNewTx(data) {
  if (!isNotificationEnabled("addressNewTx")) return;
  if (isSilentPaymentData(data)) return;
  const address = data?.addressData?.address || AppState.currentLookupInput;
  if (!address) return;
  showAppNotification({
    title: t("notifyAddressNewTx"),
    body: t("notifyBodyAddress", { address: shortNotifyId(address) }),
    tag: `addr-new-${address}`,
  });
}

function notifyAddressTxConfirmed(data) {
  if (!isNotificationEnabled("txConfirmed")) return;
  if (isSilentPaymentData(data)) return;
  const address = data?.addressData?.address || AppState.currentLookupInput;
  if (!address) return;
  showAppNotification({
    title: t("notifyTxConfirmed"),
    body: t("notifyBodyAddress", { address: shortNotifyId(address) }),
    tag: `addr-confirmed-${address}`,
  });
}

function updateNotificationsUi() {
  const settingsNotifyValue = document.getElementById("settingsNotifyValue");
  const settingsNotifyNav = document.getElementById("settingsNavNotifications");
  const supported = isNotificationApiAvailable();
  if (
    supported &&
    Notification.permission === "denied" &&
    anyNotificationEnabled()
  ) {
    notifyPrefs = { ...DEFAULT_NOTIFY_PREFS };
    saveNotificationPrefs(notifyPrefs);
  }
  const prefs = getNotificationPrefs();

  if (settingsNotifyNav) {
    settingsNotifyNav.disabled = !supported;
    settingsNotifyNav.setAttribute("aria-disabled", String(!supported));
    settingsNotifyNav.classList.toggle("is-unavailable", !supported);
  }

  if (settingsNotifyValue) {
    settingsNotifyValue.hidden = !supported;
    if (supported) {
      settingsNotifyValue.textContent = anyNotificationEnabled()
        ? t("notificationsOn")
        : t("notificationsOff");
    } else {
      settingsNotifyValue.textContent = "";
    }
  }

  if (
    !supported &&
    typeof getCurrentSettingsPanel === "function" &&
    getCurrentSettingsPanel() === "notifications" &&
    typeof setSettingsPanel === "function"
  ) {
    setSettingsPanel("language");
  }

  document.querySelectorAll(".notifications-menu__option").forEach((option) => {
    const type = option.dataset.notify;
    const enabled = Boolean(type && prefs[type]);
    option.classList.toggle("is-selected", enabled);
    option.setAttribute("aria-checked", String(enabled));
    option.disabled = !supported;
  });
}

notifyPrefs = loadNotificationPrefs();
updateNotificationsUi();
if (anyNotificationEnabled()) {
  void ensureNotifyServiceWorker();
}

window.NOTIFY_TYPES = NOTIFY_TYPES;
window.updateNotificationsUi = updateNotificationsUi;
window.isNotificationApiAvailable = isNotificationApiAvailable;
window.getNotificationPrefs = getNotificationPrefs;
window.isNotificationEnabled = isNotificationEnabled;
window.anyNotificationEnabled = anyNotificationEnabled;
window.setNotificationEnabled = setNotificationEnabled;
window.notifyNewBlock = notifyNewBlock;
window.notifyDifficultyAdjustment = notifyDifficultyAdjustment;
window.notifyHalving = notifyHalving;
window.onBlockHeightAdvanced = onBlockHeightAdvanced;
window.notifyTxConfirmed = notifyTxConfirmed;
window.notifyAddressNewTx = notifyAddressNewTx;
window.notifyAddressTxConfirmed = notifyAddressTxConfirmed;
window.isSilentPaymentData = isSilentPaymentData;
