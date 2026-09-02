# Bitcoin Explorer

A small client-side app for checking on-chain Bitcoin, Lightning, and Liquid data in real time. No backend, no accounts, no build step. Open `index.html` in a browser, or serve the folder locally.

I built this for everyday stuff: verify a donation address, check a balance, export history for accounting, peek at a Lightning address, or dig into old P2PK outputs without spinning up a full explorer.

## What you can do

Look up Bitcoin or Liquid addresses, silent payment addresses, public keys, and transactions from one search box. You get confirmed balance with live fiat (USD or BRL), script type, tx count, last activity, and whether the pubkey is exposed on-chain. Silent payment addresses (BIP-352, `sp1…`) are decoded locally: you see the address, network, type, scan key, and spend key. The balance is shown as Confidential because an explorer cannot scan those outputs, and incoming unconfirmed activity is not watched.

Pending funds show up as a net unconfirmed amount with arrows for incoming and outgoing mempool activity.

Transactions show output value, fee, confirmations, first-seen time in the mempool, time to confirm, and whether there is embedded data (OP_RETURN, inscriptions, runes, and similar).

Lightning is supported too. You can open a channel by short ID or full ID, look up a Lightning address (`user@domain`), decode a BOLT11 invoice (`lnbc…`), and generate a BOLT11 invoice from a Lightning address with a QR and a copy button.

Confirmed history can be exported to Excel (`.xlsx`). Addresses and pubkeys can also be shared as a QR code.

## Interface

### Navigation bar

| Control | Behavior |
|---|---|
| **Bitcoin logo** | Returns to the main search view (clears the search, hides results — same idea as opening the app fresh). |
| **Network** | Opens a full page of live chain stats as cards (height, hashrate, high-priority fee rate, difficulty, blocks to adjustment/halving, supply, non-zero addresses). |
| **Valuation** | Opens a full page of market metrics as cards (Bitcoin price ticking from live exchange quotes, Mayer Multiple, MVRV, Fear & Greed). |
| **Sound toggle** | Mute or unmute mempool / confirmation alerts. |
| **Settings (gear)** | Language, display currency, browser notifications, and About. |

Language (English / Brazilian Portuguese) and currency (USD / BRL) are independent and both stick in `localStorage`. Sound mute and notification preferences are stored too.

Footer social links point to X and GitHub.

### Network and Valuation pages

Network and Valuation are dedicated views with a card grid, not hover tooltips. Values use a digit odometer that rolls smoothly when numbers change (directional wrap, distance-based timing, light stagger). While data is loading, cards show an animated “Loading…” state.

| Network cards | Valuation cards |
|---|---|
| Block height | Bitcoin price (selected currency) |
| Blocks to halving | Mayer Multiple |
| Blocks to difficulty adjustment | MVRV ratio |
| Hash rate | Fear & Greed |
| Fee rate (high priority, sat/vB) | |
| Difficulty | |
| Total supply | |
| Total transactions since genesis | |
| Non-zero balance addresses | |

Hashrate and difficulty come from mempool.space `GET /api/v1/mining/hashrate/3d`. The fee rate card uses mempool.space high priority (`fastestFee`) from `GET /api/v1/fees/recommended`. Supply is computed locally from the halving schedule at the current height. Non-zero balance address count and total confirmed transactions since genesis come from Blockchair `GET /bitcoin/stats` (`hodling_addresses` and `transactions`), refreshed at most once per hour. Total transactions fall back to Blockchain.com `GET /charts/n-transactions-total` if Blockchair omits that field. The Total Transactions card starts at confirmed count plus the current mempool size from mempool.space `GET /mempool` (`count`), then ticks up for every unique new mempool transaction from the same WebSocket `track-mempool` feed (and `/mempool/recent` fallback) used by the falling-blocks animation, without the animation's concurrent-block cap.

Mayer Multiple, MVRV, and Fear & Greed are color coded:

| Color | Meaning |
|---|---|
| Green | Cheap / undervalued (Mayer < 1, MVRV < 1, Fear) |
| Yellow | Neutral (Mayer 1 to 2.4, MVRV 1 to 3.7, Neutral) |
| Red | Expensive / overvalued (Mayer > 2.4, MVRV > 3.7, Greed) |

Market metrics are cached in `localStorage` for an hour so reloads and rate limits hurt less.

### Settings and About

The gear menu offers:

- **Language** — English or Portuguese (`pt-BR`). Labels, errors, date formatting, and re-render of open results update immediately.
- **Currency** — USD or BRL for balances and the Valuation price card. Live quotes come from exchange tickers ([Binance](https://api.binance.com) `BTCUSDT` / `BTCBRL`, then [Coinbase](https://api.coinbase.com) spot), polled about once a second **only while the price is on screen** (Valuation page, or an address with a visible fiat balance). The tab being hidden, Network, home, transactions, and Lightning views do not hit the price APIs. If the live tickers fail, USD falls back to mempool.space `GET /api/v1/prices` and BRL to [CoinGecko](https://api.coingecko.com). The last good value stays up if a call fails.
- **Notifications** — optional browser notifications, each toggleable on its own: new block mined; watched transaction confirmed (while a tx is open); new transaction on the open address; confirmation of a transaction on the open address. Enabling a type asks for browser permission and sends a test toast to Windows. Alerts keep working if the tab is minimized, but the page must stay open (do not close the tab or the browser). Prefer https or localhost; `file://` often blocks notifications. Silent payment lookups never fire address notifications, because those outputs cannot be scanned here.
- **About** — short in-app summary from `about.js` (what you can look up, tips, data sources). Not a full README clone.

### Falling mempool blocks

On load, the app connects to a mempool WebSocket (mempool.space first, then public mirrors) and listens to global mempool traffic. Each new mempool tx drops a small block behind the card.

Global blocks go from green to red by fee rate (`fee / vsize`). If you are watching an address or pubkey, purple blocks show when a mempool tx touches that target.

Blocks are small squares (about 8 to 18 px) with a ₿ in the middle. At most 36 fall at once; the rest wait in a queue so the page stays smooth. If the socket dies or fails to connect within 5 seconds, the app rotates mirrors and falls back to polling `/api/mempool/recent` every 2.5 seconds.

### Input routing

The same search field accepts Bitcoin/Liquid addresses, silent payment addresses, public keys, txids, Lightning channel IDs, Lightning addresses, and BOLT11 invoices. Classification order:

1. 64-character hex → transaction ID  
2. BOLT11 (`lnbc…`, `lntb…`, optional `lightning:` prefix) → Lightning invoice  
3. `user@domain` → Lightning address  
4. Short or full channel IDs → Lightning channel  
5. Everything else → address / public key / silent payment path  

### Supported inputs

| Input type | Format | Example |
|---|---|---|
| Legacy P2PKH | starts with `1` | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` |
| P2SH | starts with `3` | `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy` |
| Native SegWit P2WPKH | `bc1q`, 42 chars | `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` |
| Native SegWit P2WSH | `bc1q`, 62 chars | longer `bc1q...` bech32 |
| Taproot P2TR | starts with `bc1p` | `bc1p...` |
| Silent payment (BIP-352) | `sp1…` (mainnet) or `tsp1…` (testnet) | `sp1qqgste7k9hx0qftg6qmwlkqtwuy6cycyavzmzj85c6qdfhjdpdjtdgqjuexzk6murw56suy3e0rd2cgqvycxttddwsvgxe2usfpxumr70xc9pkqwv` |
| Liquid addresses | `ex1...`, `lq1...`, confidential, etc. | Liquid Network addresses |
| Compressed public key | 66 hex chars, `02` or `03` | `02...` / `03...` |
| Uncompressed public key | 130 hex chars, `04` | `04...` |
| Transaction ID | 64 hex chars | `f4184fc596403b9d638783cf57adfe4c75c605f6356fbc9133855e5811f2e4fe6` |
| Lightning address | `user@domain` | `hello@getalby.com` |
| Lightning channel (short ID) | `blockxindexxoutput` or colons | `811984x2037x0` |
| Lightning channel (full ID) | 10 to 20 digit decimal | `892785849701564416` |
| Lightning invoice (BOLT11) | `lnbc…` / `lntb…` (optional `lightning:` prefix) | `lnbc20u1p…` |

### Transaction lookup

For a txid you get:

| Field | Description |
|---|---|
| Output value | Total BTC in outputs (large display) |
| Status | Confirmed or Unconfirmed (unconfirmed blinks yellow) |
| Transaction ID | Full txid (shortened to one line; hover for the rest) |
| First Seen Date | When it first hit the mempool |
| Fee | `rate sat/vB × vsize vB = fee sats` |
| Embedded data | Yes or No for OP_RETURN, inscriptions, runes, BRC-20, images, text, etc. |
| Confirmations | `0` while pending; `tip − height + 1` after confirm |
| Confirmed Date | Block time when confirmed (`N/A` while pending) |
| Time to confirmation | From first seen to confirm (`N/A` while pending) |
| Time since confirmation | Live counter from confirm time (`N/A` while pending) |

First-seen time comes from `GET /api/v1/transaction-times`. For older confirmed txs that return `0`, the app tries `GET /api/v1/block/{hash}/tx/{txid}/audit` and reads `firstSeen`.

Tx data refreshes every 10 seconds. A click sound plays when a watched tx confirms (unless sounds are muted).

### Lightning channel lookup

For a channel ID you get capacity (BTC), open/closed status, short ID, full ID, network, capacity in sats, created/updated times when available, both nodes (alias + truncated pubkey), and funding/closing txs. Funding and closing transaction IDs are clickable: they fill the search box and open that transaction in the app. Missing values stay as N/A and are not links.

When you open a funding or closing tx from a channel, a **Back to channel** button appears above the “Created by” footer (outside the transaction details card). It restores the previous channel lookup. A normal new search clears the back target so the button does not appear on unrelated transactions.

Data comes from mempool.space `GET /api/v1/lightning/channels/{id}`. Short IDs are turned into full IDs in the browser:

```
fullId = (blockHeight << 40) | (txIndex << 16) | outputIndex
```

`BigInt` is used so large IDs stay exact.

### Lightning invoice lookup

Paste a BOLT11 payment request (`lnbc…`, `lntb…`, or `lightning:lnbc…`). Decoding runs in the browser via `bolt11-decode.js` — no API call for the invoice body itself.

| Field | Description |
|---|---|
| Amount | Fixed BTC + sats when present, or “Any amount” for open invoices |
| Status | Under the amount: **Valid** (green) or **Expired** (red), from creation time + expiry (default 3600 s if the invoice omits `x`) |
| Invoice | Full payment request (shortened to one line; hover for the rest) |
| Network | Lightning |
| Description | Memo text when present, otherwise “No description” |
| Creation time | Invoice timestamp |
| Expire date | Creation + expiry |
| Destination node | Payee pubkey from tag `n`, or recovered from the signature when possible (uses `@noble/secp256k1` + `@noble/hashes` from CDN; best-effort online) |
| Payment hash | 32-byte payment hash |

Invalid or corrupt invoices show a decode error. Destination may show N/A if recovery fails (for example offline, no CDN, or no recoverable pubkey).

### Lightning address lookup

For `user@domain`, the app hits LNURL-pay:

```
GET https://{domain}/.well-known/lnurlp/{user}
```

You see the full address (font shrinks so it stays on one line), description from metadata when present, domain, min/max sendable in sats, and whether comments are allowed.

The ⋯ menu on that result has two separate payment options (they do not mix):

| Option | Amount | Reuse | What you get |
|---|---|---|---|
| **Show address QR code** | Open (payer chooses within min/max) | Unlimited | QR of `user@domain` (Lightning Address / LNURL-pay endpoint) |
| **Generate invoice** | Fixed (you enter sats) | Once | QR of a BOLT11 invoice (`pr`) from the LNURL callback |

**Show address QR code** shows a QR of the Lightning Address string. Compatible wallets can pay any amount allowed by the host. Use this for donations and open-amount receives.

**Generate invoice** opens a form. Amount in sats is required and must sit inside the provider min/max. Optional comment when the host allows it. The app calls the LNURL callback with `amount` in millisats and shows a QR of the returned BOLT11 (`pr`) only — never the address. Under the QR there is a **Copy invoice** button; the full string is not printed on screen.

Empty amount is rejected; the invoice flow does not fall back to an address QR.

Invoice requests go straight from the browser to the recipient’s provider, so CORS can block some hosts. If the provider returns `status: "ERROR"`, that reason is shown as-is. Discovery can succeed and invoice creation still fail when `maxSendable` is `0` or the wallet is incomplete.

## How the app works

Everything is plain HTML, CSS, and JavaScript in the browser. No server code, no database.

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
             │ + app views │          │ stats pages │          │ falling ₿   │
             └──────┬──────┘          └──────┬──────┘          └──────┬──────┘
                    │                        │                        │
    ┌───────────────┼───────────────┬────────┴───┐                    │
    ▼               ▼               ▼            ▼                    ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐      ┌──────────────┐
│ address- │ │tx-lookup │ │lightning-    │ │api-client│◄─────│ mempool WS   │
│ lookup   │ │   .js    │ │lookup.js     │ │   .js    │      │ + REST APIs  │
└──────────┘ └──────────┘ │(+ bolt11)    │ └──────────┘      └──────────────┘
    │               │     └──────────────┘        ▲
    └───────────────┴───────┬─────────────────────┘
                            ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │ dom.js · state.js · format.js · btc.js · prices.js · ui.js      │
    │ balance-sub.js · tx-sounds.js · qr.js · action-menu.js         │
    │ lightning-utils.js · bolt11-decode.js · lightning-invoice.js   │
    │ liquid-utils.js · silent-payments.js · tx-export.js            │
    │ pubkey-utils.js · tx-utils.js · i18n.js · about.js             │
    │ sounds.js · notifications.js                                    │
    └─────────────────────────────────────────────────────────────────┘
```

### Lookup flow

When you click **Check**, `lookup.js` picks a path.

**Transaction ID**

`tx-utils.js` matches 64-char hex. The app fetches `GET /api/tx/{txid}`, first-seen time, fee rate, vsize, embedded data, and confirmation count, then renders the tx panel with live timers.

**Lightning invoice (BOLT11)**

`bolt11-decode.js` matches `lnbc…` / related HRPs (and strips a `lightning:` prefix). The invoice is decoded locally: amount, description, payment hash, timestamps, expiry/status, and destination node when available.

**Lightning address**

`lightning-utils.js` matches `user@domain`. The app loads LNURL-pay info from the domain and shows min/max, description, and domain, with QR and invoice actions enabled.

**Lightning channel**

Short IDs like `811984x2037x0` or full decimal IDs are accepted. Short IDs are expanded with bit packing, then `GET /api/v1/lightning/channels/{id}` fills in capacity, status, nodes, and funding/closing txs. Funding/closing txids link into the normal transaction lookup path (`navigateToSearch`), with an optional back target so the UI can return to the channel.

**Address / public key (Bitcoin or Liquid)**

`pubkey-utils.js` and `liquid-utils.js` figure out the type and network. The app loads address or scripthash stats and the latest confirmed tx page, then computes balance, fiat (from the live price cache), script type, exposed pubkey, and last activity before rendering and starting timers. Live fiat polling starts only while that address result is on screen. See [Public keys vs addresses](#public-keys-vs-addresses) for the P2PK path.

**Silent payment (BIP-352)**

`silent-payments.js` matches Bech32m `sp1…` / `tsp1…` and decodes the scan and spend public keys in the browser. No chain API is called: those outputs are not identifiable from the address alone, so the balance is Confidential, mempool watching and auto-refresh are off, and Excel export is disabled. QR of the silent payment address still works.

### Balance calculation

The big number is **confirmed** only:

```
confirmed sats = chain_stats.funded_txo_sum − chain_stats.spent_txo_sum
confirmed BTC = confirmed sats / 100,000,000
```

Unconfirmed is separate and only shown when there is mempool activity:

```
unconfirmed sats = mempool_stats.funded_txo_sum − mempool_stats.spent_txo_sum
```

That is the **net** of all pending txs, not just the latest one:

| Pending activity | Net unconfirmed shown |
|---|---|
| +0.1 BTC receive only | `0.10000000 BTC` |
| −0.1 BTC spend only | `-0.10000000 BTC` |
| +0.2 BTC in, −0.1 BTC out | `0.10000000 BTC` |
| +0.1 BTC in, −0.1 BTC out | `0.00000000 BTC` (still shown if both directions are active) |

Fiat uses the confirmed balance and the selected display currency (USD or BRL).

### Unconfirmed direction arrows

When the unconfirmed line is visible:

| Arrow | Meaning |
|---|---|
| ▲ green | Pending incoming (`funded_txo_sum > 0`) |
| ▼ red | Pending outgoing (`spent_txo_sum > 0`) |
| Both | In and out at the same time |

Negative nets keep a minus sign, like `▼ -0.10000000 BTC unconfirmed`.

### Transaction sounds

After the first successful lookup (and after a user click unlocks audio), auto-refresh can play sounds:

| Event | Sound |
|---|---|
| New unconfirmed tx | Bell |
| New confirmed tx (address lookup) | Mechanical "done" click |
| Watched tx confirms (tx lookup) | Mechanical "done" click |

Mute with the bell in the nav. Preference is stored in `localStorage`.

Browser notifications (Settings → Notifications) are separate from sounds. Each type can be enabled on its own and uses the Notification API. Address mempool / confirmation notifications only fire while that address result is open; transaction-confirmed notifications only fire while that tx is open. New-block notifications are global.

### Exposed public key

| Input | Result |
|---|---|
| Public key hex (P2PK lookup) | Yes (you are looking at the key itself) |
| Address with spent outputs | Yes (spend scripts reveal the pubkey) |
| Address that only received, never spent | No |

### Live updates

| Timer | Interval | Purpose |
|---|---|---|
| Auto-refresh | 10 s | Re-fetch address or tx data quietly |
| Block height | 10 s | Tip, difficulty/halving countdown, supply, hashrate, difficulty |
| Live fiat price | 1 s | Exchange ticker for USD/BRL, only while Valuation or an address fiat line is visible (paused when the tab is hidden) |
| Market metrics | 1 h | Mayer Multiple, MVRV, Fear & Greed |
| Time since last tx | 1 s | Address lookup elapsed counter |
| Time since confirmation | 1 s | Tx lookup elapsed counter |
| Confirmations | 10 s | Confirmation count as blocks come in |
| Fiat / unconfirmed cycle | 10 s | Alternate subtitle between fiat and unconfirmed BTC |

A generation counter drops stale responses if you start a new lookup before the previous one finishes.

### Action menus

On an on-chain address or pubkey result, the ⋯ menu offers a QR of the lookup value and Excel export of confirmed txs.

On a Lightning address result, the ⋯ menu offers **Show address QR code** (open amount, reusable `user@domain`) and **Generate invoice** (fixed amount, one-time BOLT11 QR plus copy button). Those stay separate paths.

### QR code

QR codes use the `qrcode` library from jsDelivr (black on white, small quiet zone).

| Source | Payload | Amount / reuse | Under the QR |
|---|---|---|---|
| On-chain address / pubkey | Address or pubkey hex | n/a | nothing |
| Lightning address menu | `user@domain` | Open / unlimited | nothing |
| Generate invoice | BOLT11 (`lnbc…`) | Fixed / once | Copy invoice button |

### Excel export

Export uses the language currently selected in the app. While it runs, a blurred overlay shows the phase, a progress bar, and a detail line such as `Transactions: 50 / 156`.

Phases in short: snapshot the chain (height, time, tx count), page through confirmed `/txs/chain` batches of 25 up to that snapshot, then build and download the file.

Mempool first-seen time is left out on purpose. It is not on the Bitcoin chain and third-party APIs do not always have it. The summary sheet says so.

Large histories are a bit of a workout (hundreds of requests), so export retries batches with backoff, keeps what it already fetched, slows down after rate limits, pauses briefly between pages, uses a 20 s timeout per provider, and sticks to the snapshot from when you started export.

While retrying you will see something like “Connection issue, retrying…” with attempt count and how many txs are already kept.

**Transactions sheet** columns: Transaction ID, Timestamp Confirmed (local browser/OS time with UTC offset, e.g. `31/07/2026 2:30:00 PM (UTC-3)`), Type (Received/Sent), Amount (BTC), Size (bytes), Size (vB), Fee (sat/vB), Fee (BTC), Block Height, Inputs Count, Outputs Count.

**Summary sheet**: address or pubkey, total txs, total received, total sent, current confirmed balance, and the mempool first-seen note.

Unconfirmed mempool txs are not exported.

### Internationalization

`i18n.js` covers English and Brazilian Portuguese, plus the settings gear (language submenu, currency submenu, About entry). Switching language refreshes labels, errors, and date formatting right away. Currency can change without changing language. If something is already on screen, it re-renders without another lookup.

## Public keys vs addresses

Addresses and public keys are not the same thing on-chain, and they can hold different UTXO sets.

| Concept | What it is | How this app queries it |
|---|---|---|
| Address | Encoding of a specific output script | `GET /api/address/{address}` |
| Public key (P2PK) | Raw secp256k1 key in the script | `GET /api/scripthash/{hash}` |

### Address lookups

Normal looking addresses hit:

```
GET https://mempool.space/api/address/{address}
GET https://mempool.space/api/address/{address}/txs/chain
```

Type (`P2PKH`, `P2SH`, `P2WPKH`, `P2WSH`, `P2TR`) is inferred locally from prefix and length.

### Public key lookups (P2PK)

Early Bitcoin often used **P2PK** (Pay to Public Key), including the genesis coinbase. Script shape:

```
OP_PUSHBYTES_65 <uncompressed pubkey> OP_CHECKSIG   (uncompressed, 04...)
OP_PUSHBYTES_33 <compressed pubkey>   OP_CHECKSIG   (compressed, 02/03...)
```

mempool.space does not take a raw pubkey on `/api/address/`. The app builds the P2PK script, hashes it, and uses scripthash.

What `pubkey-utils.js` does:

1. Detect hex pubkey: 66 chars with `02`/`03` (compressed) or 130 chars with `04` (uncompressed)
2. Build scriptPubKey hex: `41` + pubkey + `ac` (uncompressed) or `21` + pubkey + `ac` (compressed)
3. SHA-256 the script with Web Crypto to get the scripthash
4. Call:
   ```
   GET https://mempool.space/api/scripthash/{scripthash}
   GET https://mempool.space/api/scripthash/{scripthash}/txs/chain
   ```

The UI labels it **Public Key:** with type **P2PK**.

#### Why balances can differ

A public key and its derived P2PKH address (`1...`) are different scripts. Coins sent to one do not show up on the other.

Rough example with the genesis uncompressed key:

| Lookup method | Endpoint | Typical balance |
|---|---|---|
| Public key (P2PK script) | `/api/scripthash/...` | ~50 BTC (coinbase + other P2PK) |
| Derived P2PKH `1A1zP1...` | `/api/address/1A1zP1...` | ~57 BTC (includes unrelated donations) |

Paste a public key and you get the P2PK scripthash balance, not the derived `1...` address balance.

## Data shown for each lookup

### Transaction

See [Transaction lookup](#transaction-lookup).

### Balance (address / public key)

| Field | Description |
|---|---|
| BTC Balance | Confirmed balance in BTC |
| Fiat / Unconfirmed | Fiat of confirmed balance in the selected currency; with mempool activity it alternates every 10 s with net unconfirmed and arrows |

### Details (on-chain address / public key)

| Field | Description |
|---|---|
| Address / Public Key | Lookup value (shortened to one line; hover for full) |
| Network | Bitcoin or Liquid |
| Address Type | P2PK, P2PKH, P2SH, P2WPKH, P2WSH, P2TR, Silent Payment, or Liquid types |
| Exposed PubKey | Yes / No (Confidential on Liquid confidential addresses; hidden for silent payments) |
| Scan Key / Spend Key | Silent payment only: compressed public keys decoded from the address |
| Transactions | Confirmed tx count (hidden for silent payments) |
| Last Transaction Date | Most recent confirmed tx time (hidden for silent payments) |
| Time Since Last Transaction | Live counter (hidden for silent payments) |

### Lightning

See [Lightning channel lookup](#lightning-channel-lookup), [Lightning address lookup](#lightning-address-lookup), and [Lightning invoice lookup](#lightning-invoice-lookup).

## Files

| File | Purpose |
|---|---|
| `index.html` | Layout, search, result panels, Network/Valuation views, settings, About/QR/invoice/export overlays |
| `styles.css` | Dark theme, animations, stats cards, invoice/QR/About UI |
| `app.js` | Startup and event wiring |
| `api-client.js` | Mempool client, live price tickers, timeouts, provider fallbacks |
| `dom.js` | DOM refs (`AppDom`) |
| `state.js` | Constants and shared state |
| `format.js` | Dates, BTC, fiat, numbers |
| `btc.js` | Balance math, address types, supply, unconfirmed helpers |
| `liquid-utils.js` | Liquid detection, types, amount labels |
| `silent-payments.js` | BIP-352 silent payment detection and Bech32m decode |
| `notifications.js` | Browser notification prefs and alerts |
| `prices.js` | Visibility-aware live fiat polling (USD / BRL) |
| `ui.js` | Errors, timers, text fitting |
| `balance-sub.js` | Fiat / unconfirmed subtitle cycle |
| `tx-sounds.js` | Sound triggers for address and tx watches |
| `address-lookup.js` | Address/pubkey load, render, auto-refresh |
| `tx-lookup.js` | Tx load, render, auto-refresh |
| `lightning-utils.js` | LN address/channel detection, ID conversion, LNURL helpers |
| `bolt11-decode.js` | BOLT11 bech32 decode, amount/tags/expiry, optional payee recovery |
| `lightning-lookup.js` | LN channel, address, and invoice load/render |
| `lightning-invoice.js` | Invoice form and BOLT11 request (from LN address) |
| `lookup.js` | Input routing, home reset, app views (check / network / valuation), channel back target |
| `qr.js` | QR overlay and invoice copy button |
| `action-menu.js` | ⋯ menus |
| `tx-export.js` | Excel export with retry/resume |
| `chain-stats.js` | Network/Valuation cards, odometer ticks, market metrics |
| `pubkey-utils.js` | Pubkey detection, P2PK script, scripthash |
| `tx-utils.js` | Txid validation and embedded data detection |
| `i18n.js` | EN / pt-BR strings, settings menu, language, currency, and notification prefs |
| `about.js` | About modal copy |
| `sounds.js` | Web Audio alerts and mute |
| `blocks-fx.js` | Mempool WS, falling blocks, fee colors |
| `favicon.svg` | Favicon |

## External dependencies

| Dependency | From | Used for |
|---|---|---|
| [qrcode](https://www.npmjs.com/package/qrcode) | jsDelivr | QR codes |
| [ExcelJS](https://www.npmjs.com/package/exceljs) | jsDelivr | Excel export |
| [@noble/secp256k1](https://www.npmjs.com/package/@noble/secp256k1) | jsDelivr (dynamic import) | Optional payee pubkey recovery from BOLT11 signature |
| [@noble/hashes](https://www.npmjs.com/package/@noble/hashes) | jsDelivr (dynamic import) | SHA-256 for invoice signature recovery |
| [mempool.space API](https://mempool.space/docs/api/rest) | mempool.space (+ mirrors) | On-chain data, Lightning channels, height, mining, USD price fallback |
| [mempool.space WebSocket](https://mempool.space/docs/api/websocket) | `wss://mempool.space/api/v1/ws` (+ mirrors) | Live mempool and watched address events |
| [Blockstream Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md) | blockstream.info | Fallback chain endpoints; Liquid via `/liquid` |
| LNURL-pay | `https://{domain}/.well-known/lnurlp/{user}` | Lightning addresses and invoices |
| [blockchain.info](https://www.blockchain.com/explorer/api/blockchain_api) | blockchain.info | Hashrate / difficulty fallback; total transaction count fallback |
| [Binance API](https://developers.binance.com/docs/binance-spot-api-docs/rest-api) | api.binance.com, data-api.binance.vision | Live BTC-USD and BTC-BRL tickers |
| [Coinbase API](https://docs.cdp.coinbase.com/exchange/reference/exchangerestapi_getproductticker) | api.coinbase.com | Live USD/BRL spot fallback |
| [CoinGecko API](https://www.coingecko.com/en/api) | api.coingecko.com | Last-resort BRL/USD, Mayer fallback |
| [CoinMetrics Community API](https://community-api.coinmetrics.io/) | community-api.coinmetrics.io | MVRV fallback |
| [bitcoin-data.com API](https://bitcoin-data.com/) | bitcoin-data.com | Primary Mayer and MVRV |
| [Alternative.me Fear & Greed API](https://alternative.me/crypto/fear-and-greed-index/) | api.alternative.me | Fear & Greed |
| [Blockchair](https://blockchair.com/api) | api.blockchair.com | Non-zero address count; total transaction count |
| Web Crypto API | Browser | SHA-256 for scripthash |
| Web Audio API | Browser | Alert sounds |
| Notifications API | Browser | Optional block / transaction alerts |

### API fallbacks (`api-client.js`)

REST calls go through `api-client.js` with a 5 second timeout per provider (20 seconds during export). On failure, the next provider is tried. Export also retries batches with backoff and resumes from the last good page.

Provider order for REST: mempool.space, mempool.emzy.de, mempool.haus, mempool.jhoenicke.de, mempool.ninja, then blockstream.info for Esplora-compatible routes.

WebSocket mirrors rotate the same way on disconnect or a 5 second connect timeout.

| Endpoint | Primary | Fallback |
|---|---|---|
| Address / tx / scripthash / block height | Mempool chain | Blockstream Esplora |
| Liquid address / tx / tip height | blockstream.info/liquid, liquid.network | none |
| `/v1/lightning/channels/{id}` | Mempool only | none |
| LNURL-pay discovery / invoice | Recipient domain | none (CORS-dependent) |
| Live BTC price (USD / BRL) | Binance ticker, then Binance Vision | Coinbase spot; then mempool `/v1/prices` (USD) or CoinGecko (BRL) |
| `/v1/mining/hashrate/3d` | Mempool chain | blockchain.info |
| `/v1/transaction-times` | Mempool chain | Block audit for confirmed txs |
| `/mempool/recent` | Mempool chain | none |
| WebSocket live events | Mempool WS mirrors | REST poll every 2.5 s |

### Market metrics fallbacks

Mayer Multiple and MVRV start at bitcoin-data.com. If that is down or rate limited:

| Metric | Primary | Fallback |
|---|---|---|
| Mayer Multiple | bitcoin-data.com | CoinGecko 200-day SMA computed locally |
| MVRV Ratio | bitcoin-data.com | CoinMetrics `CapMVRVCur` |
| Fear & Greed | Alternative.me | none |

## Author

Created by [@razivex](https://github.com/razivex)
