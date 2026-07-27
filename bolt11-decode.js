/**
 * Minimal BOLT11 (Lightning invoice) decoder for display fields.
 * Spec: https://github.com/lightning/bolts/blob/master/11-payment-encoding.md
 */

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32_CHARSET_MAP = (() => {
  const map = Object.create(null);
  for (let i = 0; i < BECH32_CHARSET.length; i += 1) {
    map[BECH32_CHARSET[i]] = i;
  }
  return map;
})();

const DEFAULT_EXPIRY_SECONDS = 3600;

const NETWORK_BY_PREFIX = {
  bc: "bitcoin",
  tb: "testnet",
  bcrt: "regtest",
  sb: "simnet",
  tbs: "signet",
};

function normalizeBolt11Input(input) {
  let value = String(input ?? "").trim();
  if (!value) return "";

  // lightning:lnbc... or LIGHTNING:LNBC...
  if (/^lightning:/i.test(value)) {
    value = value.replace(/^lightning:/i, "");
  }

  // Drop query params / fragments sometimes appended by wallets.
  value = value.split(/[?#]/)[0];

  return value.trim();
}

function isBolt11Invoice(input) {
  const value = normalizeBolt11Input(input).toLowerCase();
  if (!value.startsWith("ln")) return false;
  return (
    value.startsWith("lnbc") ||
    value.startsWith("lntb") ||
    value.startsWith("lnbcrt") ||
    value.startsWith("lnsb") ||
    value.startsWith("lntbs")
  );
}

function bech32Polymod(values) {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp) {
  const result = [];
  for (let i = 0; i < hrp.length; i += 1) {
    result.push(hrp.charCodeAt(i) >> 5);
  }
  result.push(0);
  for (let i = 0; i < hrp.length; i += 1) {
    result.push(hrp.charCodeAt(i) & 31);
  }
  return result;
}

function bech32VerifyChecksum(hrp, data) {
  return bech32Polymod(bech32HrpExpand(hrp).concat(data)) === 1;
}

function bech32Decode(str) {
  const lower = str.toLowerCase();
  if (str !== lower && str !== str.toUpperCase()) {
    throw new Error("Mixed-case bech32 string");
  }

  const pos = lower.lastIndexOf("1");
  if (pos < 1 || pos + 7 > lower.length || lower.length > 5000) {
    throw new Error("Invalid bech32 string");
  }

  const hrp = lower.slice(0, pos);
  const data = [];
  for (let i = pos + 1; i < lower.length; i += 1) {
    const value = BECH32_CHARSET_MAP[lower[i]];
    if (value === undefined) {
      throw new Error("Invalid bech32 character");
    }
    data.push(value);
  }

  if (!bech32VerifyChecksum(hrp, data)) {
    throw new Error("Invalid bech32 checksum");
  }

  return { hrp, words: data.slice(0, -6) };
}

function convertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || value >> fromBits) {
      throw new Error("Invalid convertBits value");
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
    throw new Error("Invalid convertBits padding");
  }

  return result;
}

function wordsToBytes(words) {
  return convertBits(words, 5, 8, false);
}

function wordsToBytesPadded(words) {
  return convertBits(words, 5, 8, true);
}

function wordsToInt(words) {
  let value = 0n;
  for (const word of words) {
    value = (value << 5n) | BigInt(word);
  }
  return value;
}

function parseHrp(hrp) {
  if (!hrp.startsWith("ln")) {
    throw new Error("Not a Lightning invoice");
  }

  const rest = hrp.slice(2);
  // Longest network prefixes first.
  const networks = ["bcrt", "tbs", "bc", "tb", "sb"];
  let networkPrefix = null;
  let amountPart = rest;

  for (const prefix of networks) {
    if (rest === prefix || rest.startsWith(prefix)) {
      // amount digits may follow immediately (e.g. lnbc20m)
      const after = rest.slice(prefix.length);
      if (after === "" || /^\d/.test(after)) {
        networkPrefix = prefix;
        amountPart = after;
        break;
      }
    }
  }

  if (!networkPrefix) {
    throw new Error("Unknown Lightning network in invoice");
  }

  let amountMsat = null;
  if (amountPart) {
    amountMsat = parseAmountToMsat(amountPart);
  }

  return {
    networkPrefix,
    network: NETWORK_BY_PREFIX[networkPrefix] || networkPrefix,
    amountMsat,
  };
}

/**
 * Amount in HRP: digits + optional multiplier (m/u/n/p).
 * Returns millisatoshis.
 */
function parseAmountToMsat(amountPart) {
  const match = amountPart.match(/^(\d+)([munp]?)$/);
  if (!match) {
    throw new Error("Invalid invoice amount");
  }

  const digits = match[1];
  const mult = match[2] || "";
  // BOLT11: p multiplier requires the last digit to be 0 (pico-btc granularity).
  if (mult === "p" && digits.slice(-1) !== "0") {
    throw new Error("Invalid pico amount");
  }

  // Express as BTC * 1e11 msat factors via integer math where possible.
  // 1 BTC = 1e11 msat
  const value = BigInt(digits);
  let msat;
  switch (mult) {
    case "": // BTC
      msat = value * 100_000_000_000n;
      break;
    case "m": // milli-BTC
      msat = value * 100_000_000n;
      break;
    case "u": // micro-BTC
      msat = value * 100_000n;
      break;
    case "n": // nano-BTC
      msat = value * 100n;
      break;
    case "p": // pico-BTC (0.1 msat units; last digit must be 0)
      msat = value / 10n;
      break;
    default:
      throw new Error("Invalid amount multiplier");
  }

  if (msat < 0n) throw new Error("Invalid amount");
  // Safe number for display amounts; invoices are far below MAX_SAFE_INTEGER msat.
  if (msat > BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(msat); // may lose precision for absurd amounts
  }
  return Number(msat);
}

function parseTaggedFields(words) {
  const tags = {
    paymentHash: null,
    description: null,
    descriptionHash: null,
    payeeNodeKey: null,
    expirySeconds: null,
    minFinalCltvExpiry: null,
    paymentSecret: null,
  };

  let i = 0;
  while (i + 3 <= words.length) {
    const type = words[i];
    const dataLength = (words[i + 1] << 5) | words[i + 2];
    i += 3;

    if (i + dataLength > words.length) {
      throw new Error("Invalid tagged field length");
    }

    const data = words.slice(i, i + dataLength);
    i += dataLength;

    const letter = BECH32_CHARSET[type];
    switch (letter) {
      case "p": {
        if (data.length === 52) {
          tags.paymentHash = bytesToHex(wordsToBytes(data));
        }
        break;
      }
      case "d": {
        // Variable-length UTF-8; writers pad to 5-bit words.
        tags.description = bytesToUtf8(wordsToBytesPadded(data));
        break;
      }
      case "h": {
        if (data.length === 52) {
          tags.descriptionHash = bytesToHex(wordsToBytes(data));
        }
        break;
      }
      case "n": {
        if (data.length === 53) {
          tags.payeeNodeKey = bytesToHex(wordsToBytes(data));
        }
        break;
      }
      case "x": {
        tags.expirySeconds = Number(wordsToInt(data));
        break;
      }
      case "c": {
        tags.minFinalCltvExpiry = Number(wordsToInt(data));
        break;
      }
      case "s": {
        if (data.length === 52) {
          tags.paymentSecret = bytesToHex(wordsToBytes(data));
        }
        break;
      }
      default:
        // Ignore unknown / routing / feature tags.
        break;
    }
  }

  return tags;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function bytesToUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(bytes),
    );
  } catch {
    return "";
  }
}

/**
 * Decode a BOLT11 payment request into display-oriented fields.
 * When the optional `n` (payee) tag is missing, attempts ECDSA recovery
 * from the invoice signature so destination node can still be shown.
 *
 * @returns {Promise<{
 *   invoice: string,
 *   network: string,
 *   networkPrefix: string,
 *   amountMsat: number|null,
 *   amountSats: number|null,
 *   description: string,
 *   descriptionHash: string|null,
 *   payeeNodeKey: string|null,
 *   paymentHash: string|null,
 *   createdAt: Date,
 *   createdAtUnix: number,
 *   expirySeconds: number,
 *   expiresAt: Date,
 *   expired: boolean,
 * }>}
 */
async function decodeBolt11Invoice(input) {
  const normalized = normalizeBolt11Input(input);
  if (!normalized) {
    throw new Error("Empty invoice");
  }

  const { hrp, words } = bech32Decode(normalized);
  if (words.length < 7 + 104) {
    // timestamp (7) + signature (104) minimum
    throw new Error("Invoice data too short");
  }

  const hrpInfo = parseHrp(hrp);

  // First 7 words = 35-bit unix timestamp.
  const timestampWords = words.slice(0, 7);
  const timestamp = Number(wordsToInt(timestampWords));
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    throw new Error("Invalid invoice timestamp");
  }

  // Last 104 words = signature (520 bits). Tagged fields in between.
  const taggedWords = words.slice(7, words.length - 104);
  const tags = parseTaggedFields(taggedWords);

  const expirySeconds =
    tags.expirySeconds !== null && Number.isFinite(tags.expirySeconds)
      ? tags.expirySeconds
      : DEFAULT_EXPIRY_SECONDS;

  const createdAtUnix = timestamp;
  const createdAt = new Date(createdAtUnix * 1000);
  const expiresAt = new Date((createdAtUnix + expirySeconds) * 1000);
  const expired = Date.now() > expiresAt.getTime();

  const amountMsat = hrpInfo.amountMsat;
  const amountSats =
    amountMsat === null || amountMsat === undefined
      ? null
      : Math.floor(Number(amountMsat) / 1000);

  let payeeNodeKey = tags.payeeNodeKey;
  if (!payeeNodeKey) {
    payeeNodeKey = await recoverPayeeNodeKey(hrp, words);
  }

  return {
    kind: "invoice",
    invoice: normalized.toLowerCase(),
    network: hrpInfo.network,
    networkPrefix: hrpInfo.networkPrefix,
    amountMsat: amountMsat === undefined ? null : amountMsat,
    amountSats,
    description: tags.description || "",
    descriptionHash: tags.descriptionHash,
    payeeNodeKey,
    paymentHash: tags.paymentHash,
    createdAt,
    createdAtUnix,
    expirySeconds,
    expiresAt,
    expired,
  };
}

/**
 * Recover compressed payee pubkey from BOLT11 signature when tag `n` is absent.
 * Uses @noble/secp256k1 + @noble/hashes from CDN (best-effort; returns null offline).
 */
async function recoverPayeeNodeKey(hrp, words) {
  try {
    const [hashesMod, secpMod] = await Promise.all([
      import("https://cdn.jsdelivr.net/npm/@noble/hashes@1.4.0/sha256.js/+esm"),
      import("https://cdn.jsdelivr.net/npm/@noble/secp256k1@1.7.1/+esm"),
    ]);
    const sha256 = hashesMod.sha256 || hashesMod.default?.sha256;
    const secp = secpMod.default || secpMod;
    if (typeof sha256 !== "function" || typeof secp.recoverPublicKey !== "function") {
      return null;
    }

    const sigWords = words.slice(-104);
    const sigBytes = convertBits(sigWords, 5, 8, true);
    if (sigBytes.length < 65) return null;

    const recovery = sigBytes[64];
    if (recovery < 0 || recovery > 3) return null;

    const signature = new Uint8Array(64);
    signature.set(sigBytes.slice(0, 32), 0);
    signature.set(sigBytes.slice(32, 64), 32);

    const dataWords = words.slice(0, -104);
    const dataBytes = Uint8Array.from(convertBits(dataWords, 5, 8, true));
    const hrpBytes = new TextEncoder().encode(hrp);
    const msg = new Uint8Array(hrpBytes.length + dataBytes.length);
    msg.set(hrpBytes, 0);
    msg.set(dataBytes, hrpBytes.length);
    const hash = sha256(msg);

    const pub = secp.recoverPublicKey(hash, signature, recovery, true);
    if (!pub || pub.length < 33) return null;
    return bytesToHex(Array.from(pub));
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Keep previous helper name used elsewhere for generation validation.
function isValidBolt11Invoice(invoice) {
  return isBolt11Invoice(invoice);
}

window.normalizeBolt11Input = normalizeBolt11Input;
window.isBolt11Invoice = isBolt11Invoice;
window.isValidBolt11Invoice = isValidBolt11Invoice;
window.decodeBolt11Invoice = decodeBolt11Invoice;
