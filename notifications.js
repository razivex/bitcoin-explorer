const NOTIFY_STORAGE_KEY = "bitcoin-explorer-notifications";
const NOTIFY_TYPES = [
  "newBlock",
  "txConfirmed",
  "addressNewTx",
  "addressTxConfirmed",
];

const DEFAULT_NOTIFY_PREFS = {
  newBlock: false,
  txConfirmed: false,
  addressNewTx: false,
  addressTxConfirmed: false,
};

let notifyPrefs = { ...DEFAULT_NOTIFY_PREFS };

function isNotificationApiAvailable() {
  return typeof window.Notification === "function";
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

function showAppNotification({ title, body, tag }) {
  if (!isNotificationApiAvailable()) return;
  if (Notification.permission !== "granted") return;

  try {
    const notification = new Notification(title, {
      body: body || "",
      tag: tag || undefined,
      silent: true,
    });
    notification.addEventListener("click", () => {
      try {
        window.focus();
      } catch (err) {
        console.error(err);
      }
      notification.close();
    });
  } catch (err) {
    console.error(err);
  }
}

function notifyNewBlock(height) {
  if (!isNotificationEnabled("newBlock")) return;
  const formatted =
    typeof formatBlockHeight === "function"
      ? formatBlockHeight(height)
      : String(height);
  showAppNotification({
    title: t("notifyNewBlock"),
    body: t("notifyBodyBlock", { height: formatted }),
    tag: `block-${height}`,
  });
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
  if (!isNotificationEnabled("addressTxConfirmed")) return;
  if (isSilentPaymentData(data)) return;
  const address = data?.addressData?.address || AppState.currentLookupInput;
  if (!address) return;
  showAppNotification({
    title: t("notifyAddressTxConfirmed"),
    body: t("notifyBodyAddress", { address: shortNotifyId(address) }),
    tag: `addr-confirmed-${address}`,
  });
}

function updateNotificationsUi() {
  const settingsNotifyValue = document.getElementById("settingsNotifyValue");
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

  if (settingsNotifyValue) {
    if (!supported) {
      settingsNotifyValue.textContent = t("notificationsUnsupported");
    } else {
      settingsNotifyValue.textContent = anyNotificationEnabled()
        ? t("notificationsOn")
        : t("notificationsOff");
    }
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

window.NOTIFY_TYPES = NOTIFY_TYPES;
window.updateNotificationsUi = updateNotificationsUi;
window.isNotificationApiAvailable = isNotificationApiAvailable;
window.getNotificationPrefs = getNotificationPrefs;
window.isNotificationEnabled = isNotificationEnabled;
window.anyNotificationEnabled = anyNotificationEnabled;
window.setNotificationEnabled = setNotificationEnabled;
window.notifyNewBlock = notifyNewBlock;
window.notifyTxConfirmed = notifyTxConfirmed;
window.notifyAddressNewTx = notifyAddressNewTx;
window.notifyAddressTxConfirmed = notifyAddressTxConfirmed;
window.isSilentPaymentData = isSilentPaymentData;
