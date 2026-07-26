# Bitcoin Explorer

A lightweight, client-side web app for real-time data on **on-chain Bitcoin**, **Lightning**, and **Liquid**. No backend, no accounts, and no build step — open `index.html` in a browser or serve the folder locally.

## What it is used for

- **Look up Bitcoin or Liquid addresses, public keys, or transactions** in one search box
- **Check confirmed balance** and see the live fiat value (USD or BRL)
- **Review on-chain activity** — script type, transaction count, last transaction date, and whether the pubkey is exposed
- **Track pending funds** while waiting for confirmation — net unconfirmed amount with incoming/outgoing arrows
- **Inspect a transaction** — output value, fee, confirmations, mempool first-seen time, time to confirmation, and embedded data (OP_RETURN, inscriptions, runes, etc.)
- **Look up Lightning channels** by short ID or full channel ID
- **Look up Lightning addresses** (`user@domain`) via LNURL-pay discovery
- **Generate Lightning invoices** from a Lightning address and share them with a QR code + copy button
- **Export confirmed transaction history** to Excel (`.xlsx`) with a summary sheet
- **Share an address or public key** via a scannable QR code

Useful for verifying a donation address, checking a wallet balance, exporting records for accounting, exploring Lightning payment destinations, or inspecting legacy P2PK outputs (such as early coinbase rewards) without opening a full block explorer.

## How to use

1. Open `index.html` in any modern browser, or serve the folder locally:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

2. Paste a **Bitcoin/Liquid address**, **public key**, **transaction ID**, **Lightning channel ID**, or **Lightning address**.
3. Click **Check**.

The same search box handles all input types. Classification order:

1. 64-character hex → transaction ID  
2. `user@domain` → Lightning address  
3. Short or full channel ID → Lightning channel  
4. Everything else → Bitcoin/Liquid address or public key

### Navigation bar

The top bar runs across the full width of the page and includes:

| Control | Location | Purpose |
|---|---|---|
| **Bitcoin logo** | Left | Hover to see live chain and market stats (preloaded on page load) |
| **Sound toggle** | Right | Mute or unmute transaction alert sounds |
| **Language picker** | Right | Switch between English (US flag) and Portuguese (Brazil flag) |

Language and sound preferences are saved in `localStorage`.

### Bitcoin logo tooltip

Hover the Bitcoin logo in the navigation bar to see live on-chain and market data:

| Line | Updates | Description |
|---|---|---|
| **Height** | Every 10 s | Current chain tip block height |
| **Difficult Adjustment** | Every 10 s | Blocks remaining until the next difficulty retarget |
| **Halving** | Every 10 s | Blocks remaining until the next halving |
| **Supply** | Every 10 s | Total BTC supply at the current height (whole BTC, no decimals) |
| **Hash Rate** | Every 10 s | Current network hashrate (e.g. `XX.XX ZH/s`) |
| **Difficulty** | Every 10 s | Current network difficulty (e.g. `133.87T`) |
| **Mayer Multiple** | Every 1 h | BTC price divided by the 200-day moving average |
| **MVRV Ratio** | Every 1 h | Market value to realized value ratio |
| **Fear & Greed** | Every 1 h | Crypto Fear & Greed Index (0–100) |
| **Price** | Every 10 s | Current BTC spot price in USD or BRL |

Hash rate and difficulty come from mempool.space `GET /api/v1/mining/hashrate/3d`. Total supply is computed locally from the halving schedule at the current block height.

Mayer Multiple, MVRV, and Fear & Greed values are **color-coded**:

| Color | Meaning |
|---|---|
| **Green** | Cheap / undervalued (Mayer &lt; 1, MVRV &lt; 1, Fear) |
| **Yellow** | Neutral (Mayer 1–2.4, MVRV 1–3.7, Neutral) |
| **Red** | Expensive / overvalued (Mayer &gt; 2.4, MVRV &gt; 3.7, Greed) |

Market metrics are cached in `localStorage` for one hour so they survive page reloads and API rate limits.

### Falling mempool blocks

On page load, the app connects to a mempool WebSocket (mempool.space first, then public mirrors) and subscribes to global mempool activity. Each new mempool transaction spawns one falling block behind the main card.

| Block type | Color | When |
|---|---|---|
| **Global mempool** | Green → red by fee rate (`fee / vsize`) | Every new transaction in the global mempool |
| **Watched address** | Purple | A mempool transaction touches the address or pubkey currently being looked up |

Fee colors follow a green-to-red scale by fee rate. Blocks are small squares (8–18 px) with a centered **₿** symbol. Up to 36 blocks can fall at once; additional transactions are queued and spawned steadily so the browser stays responsive. If the WebSocket drops or cannot connect within 5 seconds, the app rotates to the next WebSocket mirror and falls back to polling `/api/mempool/recent` every 2.5 seconds (also with provider fallbacks).

While an address or public key lookup is active, the app also subscribes to that target over the same WebSocket so address-specific mempool events spawn purple blocks (and still trigger transaction sounds).

### Supported inputs

| Input type | Format | Example |
|---|---|---|
| Legacy P2PKH | starts with `1` | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| P2SH | starts with `3` | `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy` |
| Native SegWit P2WPKH | `bc1q`, 42 chars | `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` |
| Native SegWit P2WSH | `bc1q`, 62 chars | `bc1q...` (longer bech32) |
| Taproot P2TR | starts with `bc1p` | `bc1p...` |
| Liquid addresses | `ex1...`, `lq1...`, confidential, etc. | Liquid Network addresses |
| Compressed public key | 66 hex chars, `02` or `03` prefix | `02...` / `03...` |
| Uncompressed public key | 130 hex chars, `04` prefix | `04...` |
| Transaction ID | 64 hex chars | `f4184fc596403b9d638783cf57adfe4c75c605f6356fbc9133855e5811f2e4fe6` |
| Lightning address | `user@domain` | `hello@getalby.com` |
| Lightning channel (short ID) | `blockxindexxoutput` or `block:index:output` | `811984x2037x0` |
| Lightning channel (full ID) | 10–20 digit decimal ID | `892785849701564416` |

### Transaction lookup

When a txid is detected, the result panel shows:

| Field | Description |
|---|---|
| **Output value** | Total BTC in transaction outputs (large display) |
| **Status** | Confirmed or Unconfirmed — unconfirmed status blinks slowly in yellow |
| **Transaction ID** | Full txid (truncated to fit one line; hover for the full value) |
| **First Seen Date** | When the transaction first entered the mempool |
| **Fee** | `rate sat/vB × vsize vB = fee sats` on one line |
| **Embedded data** | `Yes` or `No` — detects OP_RETURN, inscriptions, runes, BRC-20, images, and plain text |
| **Confirmations** | `0` while unconfirmed; `chain tip − block height + 1` after confirmation |
| **Confirmed Date** | Block time when confirmed (`N/A` while pending) |
| **Time to confirmation** | Elapsed time from first seen to confirmation (`N/A` while pending) |
| **Time since confirmation** | Live counter from confirmation time (`N/A` while pending) |

First-seen time comes from mempool.space `GET /api/v1/transaction-times` while the transaction is still in (or recently left) the mempool. For older confirmed transactions where that endpoint returns `0`, the app falls back to `GET /api/v1/block/{hash}/tx/{txid}/audit` and reads the `firstSeen` field.

Transaction data refreshes every **10 seconds**. A mechanical click sound plays when a watched transaction moves from unconfirmed to confirmed (respects the mute toggle).

### Lightning channel lookup

When a Lightning channel ID is detected, the result panel shows:

| Field | Description |
|---|---|
| **Capacity** | Channel capacity in BTC (large display) |
| **Status** | Open (green) or Closed (red) |
| **Channel ID** | Short ID (e.g. `811984x2037x0`) |
| **Full ID** | Compact integer channel ID used by the API |
| **Network** | Lightning |
| **Capacity (meta)** | Same capacity in sats |
| **Created / Updated** | Channel lifecycle timestamps when available |
| **Node A / Node B** | Alias and truncated public key for each side |
| **Funding TX / Closing TX** | On-chain funding and closing transaction IDs (`N/A` if none) |

Channel data comes from mempool.space `GET /api/v1/lightning/channels/{id}`. Short IDs are converted to full IDs client-side with:

```
fullId = (blockHeight << 40) | (txIndex << 16) | outputIndex
```

(using `BigInt` so large channel IDs stay precise).

### Lightning address lookup

When a Lightning Address (`user@domain`) is detected, the app fetches LNURL-pay metadata from:

```
GET https://{domain}/.well-known/lnurlp/{user}
```

The result panel shows:

| Field | Description |
|---|---|
| **Address** | Full Lightning address (large display; font shrinks / truncates to stay on one line) |
| **Description** | `text/plain` from LNURL metadata when present |
| **Network** | Lightning |
| **Domain** | Payment host |
| **Min / Max amount** | Sendable range in sats (from `minSendable` / `maxSendable` millisats) |
| **Comments** | Whether the provider allows a memo, and the max length |

After a successful Lightning address lookup, a **⋯** menu provides:

| Option | Purpose |
|---|---|
| **Show address QR code** | QR code of the Lightning address string |
| **Generate invoice** | Opens a form to request a BOLT11 invoice via LNURL-pay |

#### Generate invoice

1. Enter an amount in sats (optional field; must be within the provider’s min/max when set).
2. Optionally add a comment if the provider allows it.
3. Click **Generate**.

The app calls the LNURL-pay callback with `amount` in millisats and shows a QR code of the returned BOLT11 invoice (`pr`). Below the QR, a **Copy invoice** button copies the invoice string (the full invoice text is not displayed).

**Notes:**

- Invoice generation talks to the recipient’s LNURL provider from the browser. Some providers block cross-origin requests (CORS); those will fail with a clear error.
- If the provider returns `status: "ERROR"` (for example *wallet is not properly configured*), that message is shown as-is — it comes from the provider, not from this app.
- An address can appear valid at discovery time and still fail when creating an invoice (common when `maxSendable` is `0` or the wallet is incomplete).

## How the app works

The application is a static single-page interface made of plain HTML, CSS, and JavaScript. All logic runs in the browser. There is no server-side code and no database.

```
┌─────────────┐     user input      ┌──────────────────┐
│  index.html │ ──────────────────► │     app.js       │
│  styles.css │                     │ init + events    │
└─────────────┘                     └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
             ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
             │  lookup.js  │          │chain-stats  │          │ blocks-fx   │
             │ route input │          │    .js      │          │    .js      │
             └──────┬──────┘          └──────┬──────┘          └──────┬──────┘
                    │                        │                        │
    ┌───────────────┼───────────────┬────────┴───┐                    │
    ▼               ▼               ▼            ▼                    ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐      ┌──────────────┐
│ address- │ │tx-lookup │ │lightning-    │ │api-client│◄─────│ mempool WS   │
│ lookup   │ │   .js    │ │lookup.js     │ │   .js    │      │ + REST APIs  │
└──────────┘ └──────────┘ └──────────────┘ └──────────┘      └──────────────┘
    │               │               │              ▲
    └───────────────┴───────┬───────┘              │
                            ▼                      │
    ┌──────────────────────────────────────────────┴──────────────────┐
    │ dom.js · state.js · format.js · btc.js · prices.js · ui.js      │
    │ balance-sub.js · tx-sounds.js · qr.js · action-menu.js         │
    │ lightning-utils.js · lightning-invoice.js · liquid-utils.js    │
    │ tx-export.js · pubkey-utils.js · tx-utils.js · i18n.js         │
    │ sounds.js                                                       │
    └─────────────────────────────────────────────────────────────────┘
```

### Lookup flow

When the user clicks **Check**, `lookup.js` classifies the input and routes to the correct flow:

**Transaction ID**

1. **Detect txid** — `tx-utils.js` matches 64-character hex strings.
2. **Fetch transaction** — mempool.space `GET /api/tx/{txid}` plus first-seen time from `GET /api/v1/transaction-times` (with block-audit fallback for confirmed txs).
3. **Analyze outputs** — fee rate, virtual size, embedded-data detection, and confirmation count vs chain tip.
4. **Render the transaction panel** and start live timers (confirmation elapsed time, confirmation count).

**Lightning address**

1. **Detect** `user@domain` via `lightning-utils.js`.
2. **Fetch LNURL-pay info** from `https://{domain}/.well-known/lnurlp/{user}`.
3. **Render** min/max amounts, description, and domain; enable QR + invoice actions.

**Lightning channel**

1. **Detect** short ID (`811984x2037x0`) or full decimal ID.
2. **Resolve** short IDs to full IDs with bit packing (`BigInt`).
3. **Fetch** mempool.space `GET /api/v1/lightning/channels/{id}`.
4. **Render** capacity, status, both nodes, and funding/closing txs.

**Address / public key (Bitcoin or Liquid)**

1. **Classify the input** — `pubkey-utils.js` / `liquid-utils.js` decide whether the string is a standard address or a hex-encoded secp256k1 public key, and which network to use.
2. **Resolve the API target** — depending on the input type, the app queries a different endpoint (see [Public keys vs addresses](#public-keys-vs-addresses) below).
3. **Fetch on-chain data** — three lightweight API calls:
   - address or scripthash statistics (`chain_stats` + `mempool_stats`)
   - the most recent confirmed transaction (`/txs/chain`, first page)
   - BTC spot prices (`/v1/prices`)
4. **Compute derived values** — confirmed BTC balance, fiat estimate, script type, exposed pubkey status, last transaction date, and formatted timestamps.
5. **Render the result panel** and start live timers.

### Balance calculation

The main balance display shows **confirmed** funds only:

```
confirmed sats = chain_stats.funded_txo_sum − chain_stats.spent_txo_sum
confirmed BTC = confirmed sats / 100,000,000
```

Unconfirmed mempool balance is tracked separately and shown in the subtitle when mempool activity exists:

```
unconfirmed sats = mempool_stats.funded_txo_sum − mempool_stats.spent_txo_sum
```

This is the **net** of all pending transactions combined — not just the last one. Examples:

| Pending activity | Net unconfirmed shown |
|---|---|
| +0.1 BTC receive only | `0.10000000 BTC` |
| −0.1 BTC spend only | `-0.10000000 BTC` |
| +0.2 BTC in, −0.1 BTC out | `0.10000000 BTC` |
| +0.1 BTC in, −0.1 BTC out | `0.00000000 BTC` (line still shown when both directions are active) |

The fiat line is based on the **confirmed** balance using the live BTC spot price:

- **English** → USD (from mempool.space `GET /api/v1/prices`)
- **Portuguese** → BRL (from [CoinGecko](https://api.coingecko.com), since mempool.space does not provide BRL)

Prices are merged into a local cache so BRL persists across the 10-second refresh cycle. If a price request fails, the last successful cached value is reused.

### Unconfirmed direction arrows

When the unconfirmed balance line is visible, small triangles appear **before** the amount:

| Arrow | Meaning |
|---|---|
| **▲** green | Pending incoming funds (`mempool_stats.funded_txo_sum > 0`) |
| **▼** red | Pending outgoing funds (`mempool_stats.spent_txo_sum > 0`) |
| **Both** | Incoming and outgoing mempool activity at the same time |

Negative net balances are prefixed with a minus sign (e.g. `▼ -0.10000000 BTC unconfirmed`).

### Transaction sounds

After the first successful lookup, auto-refresh can trigger audio alerts (requires a prior user click to unlock browser audio):

| Event | Sound |
|---|---|
| New unconfirmed transaction | Bell |
| New confirmed transaction (address lookup) | Mechanical "done" click |
| Watched transaction confirms (tx lookup) | Mechanical "done" click |

Use the bell button in the navigation bar to mute or unmute sounds. The preference is saved in `localStorage`.

### Exposed public key

The **Exposed PubKey** field indicates whether the public key for this lookup is visible on-chain:

| Input | Result |
|---|---|
| Public key hex (P2PK lookup) | **Yes** — the key itself is being viewed |
| Address with spent outputs | **Yes** — spending reveals the pubkey in the transaction input |
| Address that only received, never spent | **No** |

### Live updates

Timers keep the UI fresh after a successful lookup:

| Timer | Interval | Purpose |
|---|---|---|
| Auto-refresh | 10 s | Silently re-fetches address or transaction data (with API fallbacks) |
| Block height & price | 10 s | Updates chain tip, difficulty/halving countdown, supply, hashrate, network difficulty, and BTC spot price in the logo tooltip |
| Market metrics | 1 h | Refreshes Mayer Multiple, MVRV Ratio, and Fear & Greed Index |
| Time since last transaction | 1 s | Updates the human-readable elapsed time counter (address lookup) |
| Time since confirmation | 1 s | Updates the elapsed time since a transaction was confirmed |
| Confirmations | 10 s | Updates confirmation count as new blocks are mined |
| Fiat / unconfirmed cycle | 10 s | When mempool activity exists, alternates the subtitle between fiat value and unconfirmed BTC (with a fade transition) |

Auto-refresh uses a generation counter so stale responses from earlier lookups are ignored if the user submits a new input before the request finishes.

### Action menu (address / public key results)

After a successful address or public key lookup, a **⋯** button appears in the top-right corner of the result card:

| Option | Purpose |
|---|---|
| **Show address QR code** | Opens a black-and-white QR code for the looked-up address or public key |
| **Export transactions to Excel** | Downloads a formatted `.xlsx` file (confirmed transactions only) |

### Action menu (Lightning address results)

After a successful Lightning address lookup, a separate **⋯** menu provides:

| Option | Purpose |
|---|---|
| **Show address QR code** | QR code of the Lightning address (`user@domain`) |
| **Generate invoice** | LNURL-pay form → BOLT11 QR + **Copy invoice** button |

### QR code

The QR option encodes the payload into a canvas using the `qrcode` library loaded from jsDelivr. The code is standard black on white with a minimal quiet zone.

| Source | Payload | Below the QR |
|---|---|---|
| On-chain address / pubkey | Address or public key hex | — |
| Lightning address | `user@domain` | — |
| Generated invoice | BOLT11 string (`lnbc…`) | **Copy invoice** button (copies the invoice; text is not shown) |

### Excel export

Export builds a workbook in the **language currently selected in the app** (English or Brazilian Portuguese).

While the file is generated, a blurred overlay shows the current step, a progress bar with percentage, and a detail line (for example `Transactions: 50 / 156`).

**Export phases:**

1. Take a chain snapshot (current block height, time, and transaction count from the lookup)
2. Fetch confirmed transactions from the chain (`/txs/chain`, paginated in batches of 25), stopping at the snapshot count and filtering out any transaction confirmed after the snapshot
3. Build the spreadsheet and download

Mempool first-seen time is **not** included in the export. That timestamp is not recorded on the Bitcoin blockchain and is not always available from third-party services. The summary sheet includes a note explaining this.

**Large exports (resilience):**

Large address histories can require hundreds of API requests. Export is built to survive transient failures without starting over:

| Mechanism | Behavior |
|---|---|
| **Per-batch retry** | Each paginated fetch retries up to 10 times with exponential backoff |
| **Resume on retry** | Already-fetched transactions stay in memory; a failed batch retries from the same pagination cursor |
| **Rate-limit backoff** | HTTP 429/502/503 responses use a longer initial delay before retry |
| **Batch pacing** | 300 ms pause between successful batches to reduce provider rate limiting |
| **Export timeout** | Export requests use a 20 s per-provider timeout (vs 5 s for normal lookups) |
| **Chain snapshot** | Export uses the transaction count and chain tip from lookup time so the file matches what was on screen when export started |

While retrying, the overlay shows *"Connection issue, retrying…"* with the attempt number and how many transactions have been kept so far.

**Transactions sheet** — one row per confirmed transaction:

| Column | Description |
|---|---|
| Transaction ID | Full txid |
| Timestamp Confirmed (UTC) | Block time when confirmed (`YYYY-MM-DD HH:MM:SS`) |
| Type | Received or Sent (color-coded in the Type column only) |
| Amount (BTC) | Net amount for the address (positive = received, negative = sent) |
| Size (bytes) | Serialized transaction size in bytes |
| Size (vB) | Virtual size in vbytes (`vsize`, or `weight / 4`) |
| Fee (sat/vB) | Fee rate (`fee / vsize`) |
| Fee (BTC) | Transaction fee |
| Block Height | Confirmation block height |
| Inputs Count | Number of inputs |
| Outputs Count | Number of outputs |

**Summary sheet** — address or public key, total transactions, total received, total sent, current confirmed balance, and a note that mempool first-seen time is excluded because it is not on-chain data.

Unconfirmed mempool transactions are **not** included in the export.

### Internationalization

`i18n.js` provides English and Brazilian Portuguese translations for all UI text. Switching language updates labels, error messages, date/time formatting, and the display currency (USD ↔ BRL) immediately. If results are already on screen, the panel refreshes in the new language without a new lookup.

## Public keys vs addresses

Bitcoin **addresses** and **public keys** are not the same thing, and they can hold different UTXO sets on-chain.

| Concept | What it represents | How this app queries it |
|---|---|---|
| **Address** | A human-readable encoding of a specific output script (P2PKH, P2SH, SegWit, Taproot, etc.) | `GET /api/address/{address}` |
| **Public key (P2PK)** | The raw secp256k1 key embedded directly in an output script | `GET /api/scripthash/{hash}` |

### Address lookups

For strings that look like normal Bitcoin addresses, the app calls the standard address endpoint:

```
GET https://mempool.space/api/address/{address}
GET https://mempool.space/api/address/{address}/txs/chain
```

The address string is sent to the API as-is. Address type (`P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, `P2TR`) is inferred locally from prefix and length.

### Public key lookups (P2PK)

Early Bitcoin outputs — including the famous genesis block coinbase — were often locked with **P2PK** (*Pay to Public Key*), not P2PKH. The output script looks like:

```
OP_PUSHBYTES_65 <uncompressed pubkey> OP_CHECKSIG   (uncompressed, 04...)
OP_PUSHBYTES_33 <compressed pubkey>   OP_CHECKSIG   (compressed, 02/03...)
```

mempool.space does **not** accept a raw public key on the `/api/address/` route. Instead, the app builds the P2PK script, hashes it, and queries the **scripthash** endpoint.

#### Step-by-step (what `pubkey-utils.js` does)

1. **Detect** a hex public key:
   - 66 characters starting with `02` or `03` → compressed
   - 130 characters starting with `04` → uncompressed
2. **Build the scriptPubKey** in hex:
   - Uncompressed: `41` + pubkey + `ac`
   - Compressed: `21` + pubkey + `ac`
   (`41` / `21` are push opcodes for 65 / 33 bytes; `ac` is `OP_CHECKSIG`)
3. **Hash the script** with SHA-256 (via the Web Crypto API) to produce the scripthash.
4. **Query mempool.space**:
   ```
   GET https://mempool.space/api/scripthash/{scripthash}
   GET https://mempool.space/api/scripthash/{scripthash}/txs/chain
   ```

The result panel labels the field **Public Key:** and shows script type **P2PK**.

#### Why balances can differ

A public key and its derived P2PKH address (`1...`) are **different scripts** on-chain. UTXOs sent to one are not included in the other.

Example — the genesis block uncompressed public key:

| Lookup method | Endpoint | Typical balance |
|---|---|---|
| Public key (P2PK script) | `/api/scripthash/...` | ~50 BTC (coinbase + other P2PK outputs) |
| Derived P2PKH address `1A1zP1...` | `/api/address/1A1zP1...` | ~57 BTC (includes unrelated donations to that address) |

When you paste a public key, the app queries the **P2PK scripthash** so you see the balance locked directly to that key — not the balance of a derived `1...` address.

## Data shown for each lookup

### Transaction

See [Transaction lookup](#transaction-lookup) above for the full field list.

### Balance (address / public key)

| Field | Description |
|---|---|
| **BTC Balance** | Confirmed balance in BTC |
| **Fiat / Unconfirmed** | Fiat value of the confirmed balance (USD or BRL). When mempool activity exists, alternates every 10 seconds between the fiat value and the net unconfirmed amount (with direction arrows) |

### Details (on-chain address / public key)

| Field | Description |
|---|---|
| **Address / Public Key** | The value that was looked up (truncated with `...` to fit one line; hover for the full value) |
| **Network** | Bitcoin or Liquid |
| **Address Type** | `P2PK`, `P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, `P2TR`, or Liquid script types |
| **Exposed PubKey** | `Yes` if the public key is visible on-chain, `No` otherwise (`Confidential` on Liquid confidential addresses) |
| **Transactions** | Total number of confirmed transactions |
| **Last Transaction Date** | When the most recent confirmed transaction was mined |
| **Time Since Last Transaction** | Live counter, updated every second |

### Lightning channel / Lightning address

See [Lightning channel lookup](#lightning-channel-lookup) and [Lightning address lookup](#lightning-address-lookup) above for the full field lists.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure, navigation bar, unified search form, on-chain / tx / Lightning result panels, action menus, QR overlay, invoice form, export progress overlay |
| `styles.css` | Dark-themed styling, unconfirmed status blink animation, invoice/QR copy UI |
| `app.js` | Thin orchestrator — initializes background refresh and binds UI events |
| `api-client.js` | Mempool API client with 5 s timeout (20 s for export), multi-provider fallbacks |
| `dom.js` | DOM element references (`AppDom`) |
| `state.js` | Shared constants (`AppConstants`) and mutable app state (`AppState`) |
| `format.js` | Date/time, BTC, fiat, and number formatting helpers |
| `btc.js` | Balance math, address types, supply calculations, unconfirmed helpers |
| `liquid-utils.js` | Liquid address detection, types, and amount labels |
| `prices.js` | Fiat price fetching and caching |
| `ui.js` | Error display, timers, and responsive text fitting |
| `balance-sub.js` | Fiat / unconfirmed subtitle cycling with fade transition |
| `tx-sounds.js` | Transaction sound detection for address and tx lookups |
| `address-lookup.js` | Address/pubkey data loading, rendering, and auto-refresh |
| `tx-lookup.js` | Transaction data loading, rendering, and auto-refresh |
| `lightning-utils.js` | Lightning address / channel ID detection, ID conversion, LNURL helpers |
| `lightning-lookup.js` | Lightning channel and address data loading and rendering |
| `lightning-invoice.js` | LNURL-pay invoice form and BOLT11 request |
| `lookup.js` | Input routing — txid, Lightning address/channel, address/pubkey |
| `qr.js` | QR code overlay generation and invoice copy button |
| `action-menu.js` | ⋯ menus for on-chain (QR, export) and Lightning address (QR, invoice) |
| `tx-export.js` | Confirmed transaction export to Excel (ExcelJS), with retry/resume for large histories |
| `chain-stats.js` | Block height, mining stats, market metrics, logo tooltip |
| `pubkey-utils.js` | Public key detection, P2PK script construction, scripthash calculation |
| `tx-utils.js` | Txid validation, embedded-data detection (OP_RETURN, inscriptions, runes, BRC-20, images) |
| `i18n.js` | English / Brazilian Portuguese translations and language picker |
| `sounds.js` | Web Audio transaction alert sounds and mute toggle |
| `blocks-fx.js` | Mempool WebSocket (with mirror rotation), falling-block animation, fee-based colors |
| `favicon.svg` | Bitcoin logo favicon |

## External dependencies

| Dependency | Loaded from | Used for |
|---|---|---|
| [qrcode](https://www.npmjs.com/package/qrcode) | jsDelivr CDN | QR code generation |
| [ExcelJS](https://www.npmjs.com/package/exceljs) | jsDelivr CDN | Excel export (.xlsx) |
| [mempool.space API](https://mempool.space/docs/api/rest) | `mempool.space` (+ mirrors) | Primary on-chain data, Lightning channel data, block height, mining stats, and USD prices |
| [mempool.space WebSocket](https://mempool.space/docs/api/websocket) | `wss://mempool.space/api/v1/ws` (+ mirrors) | Live global mempool and watched-address transaction events |
| [Blockstream Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md) | `blockstream.info` | Fallback for address, tx, scripthash, and block-height endpoints; Liquid endpoints via `blockstream.info/liquid` |
| LNURL-pay (per domain) | `https://{domain}/.well-known/lnurlp/{user}` | Lightning address discovery and invoice generation |
| [blockchain.info](https://www.blockchain.com/explorer/api/blockchain_api) | `blockchain.info` | Fallback for network hashrate and difficulty |
| [CoinGecko API](https://www.coingecko.com/en/api) | `api.coingecko.com` | BRL spot price, USD price fallback, Mayer Multiple fallback (200-day SMA) |
| [CoinMetrics Community API](https://community-api.coinmetrics.io/) | `community-api.coinmetrics.io` | MVRV Ratio fallback (`CapMVRVCur`) |
| [bitcoin-data.com API](https://bitcoin-data.com/) | `bitcoin-data.com` | Primary Mayer Multiple and MVRV data (rate-limited) |
| [Alternative.me Fear & Greed API](https://alternative.me/crypto/fear-and-greed-index/) | `api.alternative.me` | Crypto Fear & Greed Index |
| Web Crypto API | Browser built-in | SHA-256 for scripthash calculation |
| Web Audio API | Browser built-in | Transaction alert sounds |

### API fallbacks (`api-client.js`)

Every mempool.space REST call goes through `api-client.js`, which enforces a **5-second timeout** per provider (20 seconds during Excel export). If a request fails or times out, the next provider is tried automatically. Export additionally retries failed batches with exponential backoff and resumes from the last successful page instead of restarting the fetch.

**REST provider chain (in order):**

1. mempool.space
2. mempool.emzy.de
3. mempool.haus
4. mempool.jhoenicke.de
5. mempool.ninja
6. blockstream.info *(Esplora-compatible endpoints)*

**WebSocket mirrors** rotate on disconnect or a 5-second connect timeout: mempool.space → emzy.de → haus → jhoenicke.de → ninja.

**Endpoint-specific fallbacks:**

| Endpoint | Primary | Fallback |
|---|---|---|
| Address / tx / scripthash / block height | Mempool provider chain | Blockstream Esplora |
| Liquid address / tx / tip height | `blockstream.info/liquid`, `liquid.network` | — |
| `/v1/lightning/channels/{id}` | Mempool provider chain (mempool-only) | — |
| LNURL-pay discovery / invoice | Recipient domain (browser fetch) | — (CORS-dependent) |
| `/v1/prices` (USD) | Mempool provider chain | CoinGecko |
| `/v1/mining/hashrate/3d` | Mempool provider chain | blockchain.info |
| `/v1/transaction-times` | Mempool provider chain | Block audit endpoint (confirmed txs) |
| `/mempool/recent` | Mempool provider chain | — |
| WebSocket live events | Mempool WS mirrors | REST poll every 2.5 s |

### Market metrics fallbacks

Mayer Multiple and MVRV are fetched from bitcoin-data.com first. If that API is unavailable (rate limit or network error), the app falls back automatically:

| Metric | Primary source | Fallback |
|---|---|---|
| Mayer Multiple | bitcoin-data.com | Computed locally from CoinGecko 200-day price history |
| MVRV Ratio | bitcoin-data.com | CoinMetrics `CapMVRVCur` |
| Fear & Greed | Alternative.me | — |

## Author

Created by [@razivex](https://github.com/razivex)