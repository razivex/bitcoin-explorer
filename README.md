# Bitcoin Address Explorer

A lightweight, client-side web app to look up Bitcoin balances and activity directly from the timechain. No backend, no accounts, and no build step — open `index.html` in a browser or serve the folder locally.

Data is fetched live from the [mempool.space](https://mempool.space) public API.

## What it is used for

- **Check confirmed BTC balance** for any address or public key (unconfirmed shown separately)
- **See the fiat value** of the confirmed balance in real time (USD or BRL)
- **Inspect on-chain activity** — script type, exposed pubkey status, transaction count, and last transaction details
- **Track how long ago** the last confirmed transaction occurred
- **Monitor mempool activity** — directional arrows show pending incoming and outgoing funds
- **Get audio alerts** when new unconfirmed or confirmed transactions are detected
- **Share or receive payments** via a scannable QR code
- **Monitor live** — data refreshes automatically every 10 seconds
- **Switch language** between English and Brazilian Portuguese

Useful for quickly verifying a donation address, checking a wallet balance, or exploring legacy P2PK outputs (such as early coinbase rewards) without opening a full block explorer.

## How to use

1. Open `index.html` in any modern browser, or serve the folder locally:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

2. Paste a **Bitcoin address** or **public key in hex**.
3. Click **Check**.

### Navigation bar

The top bar runs across the full width of the page and includes:

| Control | Location | Purpose |
|---|---|---|
| **Bitcoin logo** | Left | Hover to see the current chain tip block height (preloaded on page load) |
| **Sound toggle** | Right | Mute or unmute transaction alert sounds |
| **Language picker** | Right | Switch between English (US flag) and Portuguese (Brazil flag) |

Language and sound preferences are saved in `localStorage`.

### Supported inputs

| Input type | Format | Example |
|---|---|---|
| Legacy P2PKH | starts with `1` | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| P2SH | starts with `3` | `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy` |
| Native SegWit P2WPKH | `bc1q`, 42 chars | `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` |
| Native SegWit P2WSH | `bc1q`, 62 chars | `bc1q...` (longer bech32) |
| Taproot P2TR | starts with `bc1p` | `bc1p...` |
| Compressed public key | 66 hex chars, `02` or `03` prefix | `02...` / `03...` |
| Uncompressed public key | 130 hex chars, `04` prefix | `04...` |

## How the app works

The application is a static single-page interface made of plain HTML, CSS, and JavaScript. All logic runs in the browser. There is no server-side code and no database.

```
┌─────────────┐     user input      ┌──────────────────┐
│  index.html │ ──────────────────► │     app.js       │
│  styles.css │                     │  (orchestration) │
└─────────────┘                     └────────┬─────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              ▼              ▼               ▼               ▼              ▼
      ┌──────────────┐ ┌──────────┐  ┌──────────────┐ ┌──────────┐  ┌──────────────┐
      │pubkey-utils  │ │  i18n.js │  │ mempool.space│ │sounds.js │  │ qrcode (CDN) │
      │.js           │ │          │  │ REST API     │ │          │  │ QR rendering │
      └──────────────┘ └──────────┘  └──────────────┘ └──────────┘  └──────────────┘
```

### Lookup flow

When the user clicks **Check**, `app.js` runs this pipeline:

1. **Classify the input** — `pubkey-utils.js` decides whether the string is a standard address or a hex-encoded secp256k1 public key.
2. **Resolve the API target** — depending on the input type, the app queries a different mempool.space endpoint (see [Public keys vs addresses](#public-keys-vs-addresses) below).
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

The fiat line is based on the **confirmed** balance using the live price from `GET /api/v1/prices`:

- **English** → USD
- **Portuguese** → BRL

If the price request fails, the last successful cached price is reused.

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
| New confirmed transaction | Mechanical "done" click |

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
| Auto-refresh | 10 s | Silently re-fetches all on-chain data from mempool.space |
| Block height | 10 s | Updates the cached chain tip shown on logo hover |
| Time since last transaction | 1 s | Updates the human-readable elapsed time counter |
| Fiat / unconfirmed cycle | 10 s | When mempool activity exists, alternates the subtitle between fiat value and unconfirmed BTC (with a fade transition) |

Auto-refresh uses a generation counter so stale responses from earlier lookups are ignored if the user submits a new input before the request finishes.

### QR code

The QR button encodes the original lookup value (address or public key hex) into a canvas using the `qrcode` library loaded from jsDelivr.

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

mempool.space does **not** accept a raw public key on the `/api/address/` route. Instead, the website builds the P2PK script, hashes it, and queries the **scripthash** endpoint — the same approach used in this app and in [mempool's own frontend](https://github.com/mempool/mempool).

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

This app follows mempool.space and queries the **P2PK scripthash** when you paste a public key, so you see the balance locked directly to that key — not the balance of a derived `1...` address.

## Data shown for each lookup

### Balance

| Field | Description |
|---|---|
| **BTC Balance** | Confirmed balance in BTC |
| **Fiat / Unconfirmed** | Fiat value of the confirmed balance (USD or BRL). When mempool activity exists, alternates every 10 seconds between the fiat value and the net unconfirmed amount (with direction arrows) |

### Details

| Field | Description |
|---|---|
| **Address / Public Key** | The value that was looked up |
| **Address Type** | `P2PK`, `P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, or `P2TR` |
| **Exposed PubKey** | `Yes` if the public key is visible on-chain, `No` otherwise |
| **Transactions** | Total number of confirmed transactions |
| **Last Transaction Date** | When the most recent confirmed transaction was mined |
| **Time Since Last Transaction** | Live counter, updated every second |

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure, navigation bar, input form, result panel, QR overlay |
| `styles.css` | Dark-themed styling |
| `app.js` | API calls, balance logic, live timers, sounds triggers, UI updates |
| `pubkey-utils.js` | Public key detection, P2PK script construction, scripthash calculation |
| `i18n.js` | English / Brazilian Portuguese translations and language picker |
| `sounds.js` | Web Audio transaction alert sounds and mute toggle |
| `favicon.svg` | Bitcoin logo favicon |

## External dependencies

| Dependency | Loaded from | Used for |
|---|---|---|
| [qrcode](https://www.npmjs.com/package/qrcode) | jsDelivr CDN | QR code generation |
| [mempool.space API](https://mempool.space/docs/api/rest) | `mempool.space` | On-chain data, block height, and BTC prices |
| Web Crypto API | Browser built-in | SHA-256 for scripthash calculation |
| Web Audio API | Browser built-in | Transaction alert sounds |

## Author

Created by [@razivex](https://github.com/razivex)