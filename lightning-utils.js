/** Lightning Address: local-part@domain.tld */
function isLightningAddress(input) {
  const value = String(input ?? "").trim();
  if (!value || value.includes(" ") || value.includes("://")) return false;

  // Avoid matching bare emails that look like typos of other inputs.
  const match = value.match(
    /^([a-zA-Z0-9._%+-]{1,64})@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+)$/,
  );
  return Boolean(match);
}

/** Short channel id: 811984x2037x0 or 811984:2037:0 */
function isLightningChannelShortId(input) {
  const value = String(input ?? "").trim();
  return /^\d{1,8}[xX:]\d{1,8}[xX:]\d{1,5}$/.test(value);
}

/**
 * Compact channel id as decimal string (mempool uses this form).
 * Typical range is large enough to avoid block heights / small integers.
 */
function isLightningChannelFullId(input) {
  const value = String(input ?? "").trim();
  if (!/^\d{10,20}$/.test(value)) return false;

  try {
    const id = BigInt(value);
    // Lowest realistic short ids still encode a non-trivial block height.
    return id >= 1_000_000_000n;
  } catch {
    return false;
  }
}

function isLightningChannelId(input) {
  return isLightningChannelShortId(input) || isLightningChannelFullId(input);
}

function parseLightningChannelShortId(input) {
  const value = String(input ?? "").trim();
  const parts = value.split(/[xX:]/);
  if (parts.length !== 3) {
    throw new Error("Invalid short channel id");
  }

  const blockHeight = Number(parts[0]);
  const txIndex = Number(parts[1]);
  const outputIndex = Number(parts[2]);

  if (
    !Number.isInteger(blockHeight) ||
    !Number.isInteger(txIndex) ||
    !Number.isInteger(outputIndex) ||
    blockHeight < 0 ||
    txIndex < 0 ||
    outputIndex < 0
  ) {
    throw new Error("Invalid short channel id");
  }

  return { blockHeight, txIndex, outputIndex };
}

function shortChannelIdToLongId(input) {
  const { blockHeight, txIndex, outputIndex } = parseLightningChannelShortId(
    input,
  );
  const id =
    (BigInt(blockHeight) << 40n) |
    (BigInt(txIndex) << 16n) |
    BigInt(outputIndex);
  return id.toString(10);
}

function longChannelIdToShortId(longId) {
  const id = BigInt(String(longId).trim());
  const blockHeight = Number(id >> 40n);
  const txIndex = Number((id >> 16n) & 0xffffn);
  const outputIndex = Number(id & 0xffffn);
  return `${blockHeight}x${txIndex}x${outputIndex}`;
}

function resolveLightningChannelId(input) {
  const value = String(input ?? "").trim();
  if (isLightningChannelShortId(value)) {
    return shortChannelIdToLongId(value);
  }
  if (isLightningChannelFullId(value)) {
    return value;
  }
  throw new Error("Invalid lightning channel id");
}

function parseLightningAddress(input) {
  const value = String(input ?? "").trim();
  if (!isLightningAddress(value)) {
    throw new Error("Invalid lightning address");
  }

  const at = value.lastIndexOf("@");
  const username = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  return {
    address: `${username}@${domain}`,
    username,
    domain,
    lnurlpUrl: `https://${domain}/.well-known/lnurlp/${encodeURIComponent(username)}`,
  };
}

function parseLnurlMetadata(metadataRaw) {
  let description = "";
  let identifier = "";

  try {
    const parsed = JSON.parse(metadataRaw);
    if (!Array.isArray(parsed)) {
      return { description, identifier };
    }

    for (const entry of parsed) {
      if (!Array.isArray(entry) || entry.length < 2) continue;
      const [type, value] = entry;
      if (type === "text/plain" && !description) {
        description = String(value ?? "");
      }
      if (type === "text/identifier" && !identifier) {
        identifier = String(value ?? "");
      }
    }
  } catch {
    // Metadata is optional / best-effort.
  }

  return { description, identifier };
}

function msatToSats(msat) {
  const value = Number(msat);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value / 1000);
}

function satsToMsat(sats) {
  const value = Number(sats);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Invalid amount");
  }
  return Math.round(value * 1000);
}

function isValidLnurlPayResponse(data) {
  return (
    data &&
    typeof data === "object" &&
    (data.tag === "payRequest" || data.callback) &&
    Number(data.minSendable) >= 0 &&
    data.callback
  );
}

function isValidBolt11Invoice(invoice) {
  const value = String(invoice ?? "").trim().toLowerCase();
  return (
    value.startsWith("lnbc") ||
    value.startsWith("lntb") ||
    value.startsWith("lnbcrt") ||
    value.startsWith("lnsb")
  );
}

window.isLightningAddress = isLightningAddress;
window.isLightningChannelShortId = isLightningChannelShortId;
window.isLightningChannelFullId = isLightningChannelFullId;
window.isLightningChannelId = isLightningChannelId;
window.parseLightningChannelShortId = parseLightningChannelShortId;
window.shortChannelIdToLongId = shortChannelIdToLongId;
window.longChannelIdToShortId = longChannelIdToShortId;
window.resolveLightningChannelId = resolveLightningChannelId;
window.parseLightningAddress = parseLightningAddress;
window.parseLnurlMetadata = parseLnurlMetadata;
window.msatToSats = msatToSats;
window.satsToMsat = satsToMsat;
window.isValidLnurlPayResponse = isValidLnurlPayResponse;
window.isValidBolt11Invoice = isValidBolt11Invoice;
