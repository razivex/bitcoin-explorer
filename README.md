# Bitcoin Address Explorer

A lightweight web app to look up any Bitcoin address directly from the timechain.

No backend, no accounts, and no installation required — just open `index.html` in your browser.

## What it is used for

- **Check how much BTC an address holds** (confirmed + unconfirmed)
- **See the USD value** of the balance in real time
- **Inspect address activity** — type, transaction count, and last confirmation details
- **Track how long ago** the last confirmed transaction was received
- **Share or receive payments** via a scannable QR code of the address
- **Monitor an address live** — data refreshes automatically every 10 seconds

Useful for quickly verifying a donation address, checking a wallet balance, or exploring any on-chain Bitcoin address without opening a full block explorer.

## How to use

1. Open `index.html` in any modern browser.
2. Paste a Bitcoin address (Legacy `1...`, SegWit `3...`, Native SegWit `bc1q...`, or Taproot `bc1p...`).
3. Click **Check**.

Or serve the folder locally:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Data shown for each address

### Balance

| Field | Description |
|---|---|
| **BTC Balance** | Total balance in BTC (confirmed + unconfirmed combined) |
| **USD / Unconfirmed** | If there is no pending balance, shows the estimated USD value. If there is unconfirmed BTC, alternates every 10 seconds between the USD value and the unconfirmed amount |

### Address details

| Field | Description |
|---|---|
| **Address** | The full Bitcoin address looked up |
| **Address Type** | Script type: `P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, or `P2TR` (Taproot) |
| **Transactions** | Total number of confirmed transactions for this address |
| **Confirmations** | Number of confirmations on the **last confirmed transaction** (not pending ones) |
| **Confirmation Date** | Date and time that last confirmed transaction was mined (`DD/MM/YYYY HH:MM:SS AM/PM`) |
| **Time Since Last Confirmation** | Live counter showing how long ago that confirmation occurred (updates every second) |

### Extra features

- **QR Code** — click the QR button on the result panel to generate a large, scannable QR code of the address
- **Auto-refresh** — all data updates silently in the background every 10 seconds while a result is displayed

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure and layout |
| `styles.css` | Dark-themed styling |
| `app.js` | API calls, data processing, and live updates |

## Author

Built by [@razivex](https://github.com/razivex)