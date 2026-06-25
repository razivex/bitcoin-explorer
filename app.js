const API_BASE = "https://mempool.space/api";
const SATS_PER_BTC = 100_000_000;

const addressInput = document.getElementById("address");
const lookupBtn = document.getElementById("lookupBtn");
const resultEl = document.getElementById("result");
const errorEl = document.getElementById("error");
const balanceBtcEl = document.getElementById("balanceBtc");
const balanceUsdEl = document.getElementById("balanceUsd");
const metaEl = document.getElementById("meta");

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add("show");
  resultEl.classList.remove("show");
}

function clearError() {
  errorEl.textContent = "";
  errorEl.classList.remove("show");
}

function satsToBtc(sats) {
  return sats / SATS_PER_BTC;
}

function formatBtc(btc) {
  return btc.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function formatUsd(value) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcBalance(stats) {
  return (stats.funded_txo_sum || 0) - (stats.spent_txo_sum || 0);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  return response.json();
}

async function lookupAddress() {
  clearError();

  const address = addressInput.value.trim();
  if (!address) {
    showError("Please enter a Bitcoin address.");
    return;
  }

  lookupBtn.disabled = true;
  lookupBtn.textContent = "Loading...";

  try {
    const [addressData, prices] = await Promise.all([
      fetchJson(`${API_BASE}/address/${encodeURIComponent(address)}`),
      fetchJson(`${API_BASE}/v1/prices`),
    ]);

    const confirmedSats = calcBalance(addressData.chain_stats);
    const unconfirmedSats = calcBalance(addressData.mempool_stats);
    const totalSats = confirmedSats + unconfirmedSats;
    const totalBtc = satsToBtc(totalSats);
    const usdPrice = Number(prices.USD) || 0;
    const usdValue = totalBtc * usdPrice;

    balanceBtcEl.textContent = `${formatBtc(totalBtc)} BTC`;
    balanceUsdEl.textContent = `≈ ${formatUsd(usdValue)} USD`;

    const confirmedBtc = formatBtc(satsToBtc(confirmedSats));
    const unconfirmedBtc = formatBtc(satsToBtc(unconfirmedSats));

    metaEl.innerHTML = `
      <strong>Address:</strong> ${addressData.address}<br>
      <strong>Confirmed:</strong> ${confirmedBtc} BTC<br>
      <strong>Unconfirmed:</strong> ${unconfirmedBtc} BTC<br>
      <strong>Transactions:</strong> ${addressData.chain_stats.tx_count}
    `;

    resultEl.classList.add("show");
  } catch (err) {
    showError("Could not fetch balance. Check the address and try again.");
    console.error(err);
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = "Check";
  }
}

lookupBtn.addEventListener("click", lookupAddress);
addressInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") lookupAddress();
});