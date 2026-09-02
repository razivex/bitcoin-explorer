// About modal text — short summary for end users (not the full README).
window.ABOUT_TEXT = `# Bitcoin Explorer

A simple client-side app to check Bitcoin, Lightning, and Liquid data in real time.
No accounts, no backend — everything runs in your browser.

## What you can look up

Paste any of these into the search box and hit Check:

• Bitcoin or Liquid addresses
• Silent payment addresses (sp1… / BIP-352)
• Public keys (including old P2PK)
• Transaction IDs
• Lightning addresses (user@domain)
• Lightning channel IDs
• BOLT11 invoices (lnbc…)

## What you get

• Confirmed balance with live fiat (USD or BRL)
• Unconfirmed / mempool activity when it applies
• Silent payment decode (scan key and spend key; balance stays confidential)
• Transaction details (fee, confirmations, embedded data, and more)
• Lightning channel, address, and invoice details
• QR codes for addresses and invoices
• Excel export of confirmed transaction history

## Tips

• Bitcoin logo (top left) returns you to the home screen
• Network and Valuation open pages with live chain and market stat cards
• Settings (gear) covers language, currency, browser notifications, and this About page
• Sound toggle mutes confirmation / mempool alerts
• Language, currency, and notification choices are saved in your browser

## Data sources

On-chain and Lightning channel data mainly come from mempool.space (with public mirrors).
Lightning addresses use LNURL-pay on the recipient’s domain.
Live prices come from exchange tickers (Binance, then Coinbase), only while you are looking at Valuation or an address balance. USD and BRL both tick about once a second. If those feeds fail, the app falls back to mempool.space (USD) and CoinGecko (BRL).

## Author

Created by @razivex
https://github.com/razivex
`;
