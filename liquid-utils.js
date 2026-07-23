/** Liquid mainnet policy asset (L-BTC). */
const LIQUID_LBTC_ASSET_ID =
  "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d";

/**
 * Detect Liquid mainnet addresses.
 * Unconfidential: Q (P2PKH), H (P2SH), G (P2SH variant), ex1… (bech32)
 * Confidential: V… (base58), lq1… (blech32)
 */
function isLiquidAddress(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("ex1") || lower.startsWith("lq1")) {
    return /^[a-z0-9]{14,}$/i.test(trimmed);
  }

  // Confidential base58 (typically long, starts with V)
  if (/^V[1-9A-HJ-NP-Za-km-z]{50,}$/.test(trimmed)) {
    return true;
  }

  // Unconfidential / short Liquid base58
  if (/^[QHGV][1-9A-HJ-NP-Za-km-z]{25,60}$/.test(trimmed)) {
    return true;
  }

  return false;
}

function isLiquidConfidentialAddress(address) {
  const trimmed = String(address || "").trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return lower.startsWith("lq1") || /^V[1-9A-HJ-NP-Za-km-z]{50,}$/.test(trimmed);
}

function getLiquidAddressType(address) {
  const normalized = String(address || "").trim();
  if (!normalized) return t("unknown");

  const lower = normalized.toLowerCase();

  if (lower.startsWith("lq1") || normalized.startsWith("V")) {
    return t("confidential");
  }

  if (lower.startsWith("ex1p")) return "P2TR";
  if (lower.startsWith("ex1q")) {
    // Native segwit: ~42 for P2WPKH, longer for P2WSH
    if (normalized.length <= 44) return "P2WPKH";
    if (normalized.length >= 60) return "P2WSH";
    return "Bech32";
  }

  if (normalized.startsWith("Q")) return "P2PKH";
  if (normalized.startsWith("H") || normalized.startsWith("G")) return "P2SH";

  return t("unknown");
}

function hasStatsSums(stats) {
  if (!stats || typeof stats !== "object") return false;
  if (!("funded_txo_sum" in stats) || !("spent_txo_sum" in stats)) return false;
  return (
    Number.isFinite(Number(stats.funded_txo_sum)) &&
    Number.isFinite(Number(stats.spent_txo_sum))
  );
}

function isLiquidAddressData(addressData) {
  return Boolean(
    addressData?.chain_stats &&
      Number.isFinite(Number(addressData.chain_stats.tx_count)),
  );
}

function isVoutConfidential(vout) {
  if (!vout || typeof vout !== "object") return false;
  if (vout.valuecommitment) return true;
  if (
    vout.assetcommitment &&
    (vout.value === undefined || vout.value === null)
  ) {
    return true;
  }
  return false;
}

function isTxOutputValueConfidential(tx) {
  const vouts = tx?.vout;
  if (!Array.isArray(vouts) || vouts.length === 0) return false;

  for (const vout of vouts) {
    if (vout.scriptpubkey_type === "fee") continue;
    if (vout.scriptpubkey_type === "op_return") continue;
    if (isVoutConfidential(vout)) return true;
    if (vout.value === undefined || vout.value === null) return true;
  }

  return false;
}

/**
 * Sum explicit output values. Returns null when any non-fee output is confidential.
 */
function calcLiquidTxOutputValue(tx) {
  if (isTxOutputValueConfidential(tx)) return null;

  const vouts = tx?.vout;
  if (!Array.isArray(vouts)) return 0;

  return vouts.reduce((sum, vout) => {
    if (vout.scriptpubkey_type === "fee") return sum;
    return sum + (Number(vout.value) || 0);
  }, 0);
}

function getLiquidTxFeeSats(tx) {
  const fee = Number(tx?.fee);
  if (Number.isFinite(fee) && fee >= 0) return fee;

  // Fee may appear as an explicit fee output
  for (const vout of tx?.vout || []) {
    if (vout.scriptpubkey_type === "fee" && Number.isFinite(Number(vout.value))) {
      return Number(vout.value);
    }
  }

  // If any input/output is confidential and fee is missing, treat as confidential
  if (isTxOutputValueConfidential(tx)) return null;

  return null;
}

function formatAssetAmountLabel(amountBtc, { network = "bitcoin", confidential = false } = {}) {
  if (confidential || amountBtc === null || amountBtc === undefined) {
    return t("confidential");
  }

  const unit = network === "liquid" ? "L-BTC" : "BTC";
  return `${formatBtc(amountBtc)} ${unit}`;
}

window.LIQUID_LBTC_ASSET_ID = LIQUID_LBTC_ASSET_ID;
window.isLiquidAddress = isLiquidAddress;
window.isLiquidConfidentialAddress = isLiquidConfidentialAddress;
window.getLiquidAddressType = getLiquidAddressType;
window.hasStatsSums = hasStatsSums;
window.isLiquidAddressData = isLiquidAddressData;
window.isVoutConfidential = isVoutConfidential;
window.isTxOutputValueConfidential = isTxOutputValueConfidential;
window.calcLiquidTxOutputValue = calcLiquidTxOutputValue;
window.getLiquidTxFeeSats = getLiquidTxFeeSats;
window.formatAssetAmountLabel = formatAssetAmountLabel;
