function isHexPublicKey(input) {
  const normalized = input.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized)) {
    return false;
  }

  if (
    normalized.length === 66 &&
    (normalized.startsWith("02") || normalized.startsWith("03"))
  ) {
    return true;
  }

  if (normalized.length === 130 && normalized.startsWith("04")) {
    return true;
  }

  return false;
}

function hexToBytes(hex) {
  const normalized = hex.trim().toLowerCase();
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex length");
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = Number.parseInt(
      normalized.slice(index * 2, index * 2 + 2),
      16,
    );
    if (!Number.isFinite(byte)) {
      throw new Error("Invalid hex character");
    }
    bytes[index] = byte;
  }

  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

async function sha256(data) {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

function buildP2pkScriptPubKey(publicKeyHex) {
  const normalized = publicKeyHex.trim().toLowerCase();
  const pushOpcode = normalized.length === 130 ? "41" : "21";
  return pushOpcode + normalized + "ac";
}

async function calcScriptHash(scriptHex) {
  const scriptBytes = hexToBytes(scriptHex);
  const hash = await sha256(scriptBytes);
  return bytesToHex(hash);
}

async function resolveLookupTarget(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { mode: "address", queryKey: trimmed, displayValue: trimmed };
  }

  if (isHexPublicKey(trimmed)) {
    const scriptPubKey = buildP2pkScriptPubKey(trimmed);
    const scriptHash = await calcScriptHash(scriptPubKey);
    return {
      mode: "pubkey",
      queryKey: scriptHash,
      displayValue: trimmed,
    };
  }

  return { mode: "address", queryKey: trimmed, displayValue: trimmed };
}