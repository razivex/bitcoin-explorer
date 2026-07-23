function calcBalance(stats) {
  if (!stats) return 0;

  const funded = Number(stats.funded_txo_sum) || 0;
  const spent = Number(stats.spent_txo_sum) || 0;
  return funded - spent;
}

function isValidAddressData(addressData, { network = "bitcoin" } = {}) {
  if (!addressData?.chain_stats) return false;

  if (network === "liquid") {
    return Number.isFinite(Number(addressData.chain_stats.tx_count));
  }

  return (
    Number.isFinite(Number(addressData.chain_stats.funded_txo_sum)) &&
    Number.isFinite(Number(addressData.chain_stats.spent_txo_sum))
  );
}

function hasSpentOutputs(stats) {
  if (!stats) return false;

  const spentCount = Number(stats.spent_txo_count) || 0;
  const spentSum = Number(stats.spent_txo_sum) || 0;
  return spentCount > 0 || spentSum > 0;
}

function isPublicKeyExposed(lookupMode, addressData) {
  if (lookupMode === "pubkey") {
    return true;
  }

  return (
    hasSpentOutputs(addressData.chain_stats) ||
    hasSpentOutputs(addressData.mempool_stats)
  );
}

function formatExposedPubKey(exposed) {
  return exposed ? t("yes") : t("no");
}

function getAddressType(
  address,
  { isPublicKey = false, network = "bitcoin" } = {},
) {
  const normalized = address.trim();
  if (!normalized) return t("unknown");

  if (network === "liquid" || isLiquidAddress(normalized)) {
    return getLiquidAddressType(normalized);
  }

  if (isPublicKey || isHexPublicKey(normalized)) {
    return "P2PK";
  }

  const lower = normalized.toLowerCase();
  if (lower.startsWith("bc1p")) return "P2TR";
  if (lower.startsWith("bc1q")) {
    if (normalized.length === 42) return "P2WPKH";
    if (normalized.length === 62) return "P2WSH";
    return "Bech32";
  }
  if (normalized.startsWith("1")) return "P2PKH";
  if (normalized.startsWith("3")) return "P2SH";
  return t("unknown");
}

function getTxTimestamp(tx) {
  const blockTime = tx?.status?.block_time;
  if (!blockTime) return null;
  return new Date(blockTime * 1000);
}

function calcTxOutputValue(tx) {
  if (!tx?.vout) return 0;

  return tx.vout.reduce((sum, vout) => sum + (Number(vout.value) || 0), 0);
}

function getTxVsize(tx) {
  const vsize = Number(tx?.vsize);
  if (Number.isFinite(vsize) && vsize > 0) return vsize;

  // Liquid/Elements often exposes discount_vsize for fee-rate calculations.
  const discountVsize = Number(tx?.discount_vsize);
  if (Number.isFinite(discountVsize) && discountVsize > 0) return discountVsize;

  const weight = Number(tx?.weight);
  if (Number.isFinite(weight) && weight > 0) return Math.ceil(weight / 4);

  const size = Number(tx?.size);
  if (Number.isFinite(size) && size > 0) return size;

  return null;
}

function blocksUntilDifficultyAdjustment(blockHeight) {
  const remainder = blockHeight % AppConstants.DIFFICULTY_ADJUSTMENT_INTERVAL;
  return remainder === 0
    ? AppConstants.DIFFICULTY_ADJUSTMENT_INTERVAL
    : AppConstants.DIFFICULTY_ADJUSTMENT_INTERVAL - remainder;
}

function blocksUntilHalving(blockHeight) {
  const nextHalving =
    (Math.floor(blockHeight / AppConstants.HALVING_INTERVAL) + 1) *
    AppConstants.HALVING_INTERVAL;
  return nextHalving - blockHeight;
}

function totalBtcSupplyFromHeight(blockHeight) {
  const height = Number(blockHeight);
  if (!Number.isFinite(height) || height < 0) return null;

  let remainingBlocks = height + 1;
  let era = 0;
  let supplyBtc = 0;

  while (remainingBlocks > 0) {
    const blockSubsidyBtc = 50 / 2 ** era;
    const blocksInEra = Math.min(
      remainingBlocks,
      AppConstants.HALVING_INTERVAL,
    );
    supplyBtc += blocksInEra * blockSubsidyBtc;
    remainingBlocks -= blocksInEra;
    era += 1;
  }

  return supplyBtc;
}

function formatTotalBtcSupply(blockHeight) {
  const supplyBtc = totalBtcSupplyFromHeight(blockHeight);
  if (supplyBtc === null) return t("na");
  return Math.floor(supplyBtc).toLocaleString(getLocale(), {
    maximumFractionDigits: 0,
  });
}

function getUnconfirmedArrowState(mempoolStats) {
  const funded = Number(mempoolStats?.funded_txo_sum) || 0;
  const spent = Number(mempoolStats?.spent_txo_sum) || 0;

  return {
    up: funded > 0,
    down: spent > 0,
  };
}

function hasUnconfirmedActivity(unconfirmedSats, mempoolStats) {
  if (unconfirmedSats !== 0) return true;

  const funded = Number(mempoolStats?.funded_txo_sum) || 0;
  const spent = Number(mempoolStats?.spent_txo_sum) || 0;
  return funded > 0 || spent > 0;
}

function formatUnconfirmedText(unconfirmedSats, unconfirmedBtc) {
  const absAmount = formatBtc(Math.abs(unconfirmedBtc));
  const signedAmount = unconfirmedSats < 0 ? `-${absAmount}` : absAmount;
  return t("btcUnconfirmed", { amount: signedAmount });
}

window.calcBalance = calcBalance;
window.isValidAddressData = isValidAddressData;
window.hasSpentOutputs = hasSpentOutputs;
window.isPublicKeyExposed = isPublicKeyExposed;
window.formatExposedPubKey = formatExposedPubKey;
window.getAddressType = getAddressType;
window.getTxTimestamp = getTxTimestamp;
window.calcTxOutputValue = calcTxOutputValue;
window.getTxVsize = getTxVsize;
window.blocksUntilDifficultyAdjustment = blocksUntilDifficultyAdjustment;
window.blocksUntilHalving = blocksUntilHalving;
window.totalBtcSupplyFromHeight = totalBtcSupplyFromHeight;
window.formatTotalBtcSupply = formatTotalBtcSupply;
window.getUnconfirmedArrowState = getUnconfirmedArrowState;
window.hasUnconfirmedActivity = hasUnconfirmedActivity;
window.formatUnconfirmedText = formatUnconfirmedText;