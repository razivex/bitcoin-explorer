/**
 * BIP-352 Silent Payment address detection and decoding.
 * Addresses are Bech32m (not Bech32): HRP "sp" (mainnet) or "tsp" (testnet).
 * Version 0 payload is serP(B_scan) || serP(B_m) — two 33-byte compressed pubkeys.
 */

const SP_BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const SP_BECH32_CHARSET_MAP = (() => {
  const map = Object.create(null);
  for (let i = 0; i < SP_BECH32_CHARSET.length; i += 1) {
    map[SP_BECH32_CHARSET[i]] = i;
  }
  return map;
})();

const SP_BECH32M_CONST = 0x2bc830a3;
const SP_GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const SP_V0_PAYLOAD_BYTES = 66;
const SP_COMPRESSED_PUBKEY_BYTES = 33;

function spBech32Polymod(values) {
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= SP_GEN[i];
    }
  }
  return chk;
}

function spBech32HrpExpand(hrp) {
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

function spConvertBits(data, fromBits, toBits, pad) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;

  for (const value of data) {
    if (value < 0 || value >> fromBits) return null;
    acc = ((acc << fromBits) | value) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits) result.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }

  return result;
}

function spBytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function isCompressedPubKeyBytes(bytes) {
  if (!bytes || bytes.length !== SP_COMPRESSED_PUBKEY_BYTES) return false;
  return bytes[0] === 0x02 || bytes[0] === 0x03;
}

/**
 * Prefix check so any sp1… / tsp1… input takes the silent-payment path.
 * Decode still validates checksum, length, and keys. A short truncated
 * paste must not fall through to a chain balance lookup.
 */
function looksLikeSilentPaymentAddress(input) {
  const trimmed = String(input || "").trim().toLowerCase();
  if (!trimmed) return false;
  return /^(sp|tsp)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{6,1016}$/.test(
    trimmed,
  );
}

function silentPaymentMinLength(hrp) {
  return hrp === "tsp" ? 117 : 116;
}

function isIncompleteSilentPaymentAddress(input) {
  const trimmed = String(input || "").trim().toLowerCase();
  if (!looksLikeSilentPaymentAddress(trimmed)) return false;
  const pos = trimmed.lastIndexOf("1");
  const hrp = trimmed.slice(0, pos);
  return trimmed.length < silentPaymentMinLength(hrp);
}

function isSilentPaymentAddress(input) {
  return Boolean(decodeSilentPaymentAddress(input));
}

/**
 * @returns {{
 *   address: string,
 *   hrp: "sp" | "tsp",
 *   network: "bitcoin" | "bitcoin-testnet",
 *   version: number,
 *   scanKey: string,
 *   spendKey: string,
 * } | null}
 */
function decodeSilentPaymentAddress(input) {
  const original = String(input || "").trim();
  if (!original) return null;

  const lower = original.toLowerCase();
  if (original !== lower && original !== original.toUpperCase()) return null;
  if (lower.length > 1023) return null;

  const pos = lower.lastIndexOf("1");
  if (pos < 1 || pos + 7 > lower.length) return null;

  const hrp = lower.slice(0, pos);
  if (hrp !== "sp" && hrp !== "tsp") return null;

  const data = [];
  for (let i = pos + 1; i < lower.length; i += 1) {
    const value = SP_BECH32_CHARSET_MAP[lower[i]];
    if (value === undefined) return null;
    data.push(value);
  }

  if (data.length < 7) return null;
  if (spBech32Polymod(spBech32HrpExpand(hrp).concat(data)) !== SP_BECH32M_CONST) {
    return null;
  }

  const words = data.slice(0, -6);
  if (words.length < 2) return null;

  const version = words[0];
  if (!Number.isInteger(version) || version < 0 || version > 31) return null;

  const payload = spConvertBits(words.slice(1), 5, 8, false);
  if (!payload) return null;

  // v0 is 66 bytes. Higher versions may append extra data; require at least v0.
  if (payload.length < SP_V0_PAYLOAD_BYTES) return null;
  if (version === 0 && payload.length !== SP_V0_PAYLOAD_BYTES) return null;

  const scanBytes = payload.slice(0, SP_COMPRESSED_PUBKEY_BYTES);
  const spendBytes = payload.slice(
    SP_COMPRESSED_PUBKEY_BYTES,
    SP_COMPRESSED_PUBKEY_BYTES * 2,
  );

  if (!isCompressedPubKeyBytes(scanBytes) || !isCompressedPubKeyBytes(spendBytes)) {
    return null;
  }

  return {
    address: lower,
    hrp,
    network: hrp === "tsp" ? "bitcoin-testnet" : "bitcoin",
    version,
    scanKey: spBytesToHex(scanBytes),
    spendKey: spBytesToHex(spendBytes),
  };
}

window.looksLikeSilentPaymentAddress = looksLikeSilentPaymentAddress;
window.isIncompleteSilentPaymentAddress = isIncompleteSilentPaymentAddress;
window.isSilentPaymentAddress = isSilentPaymentAddress;
window.decodeSilentPaymentAddress = decodeSilentPaymentAddress;
