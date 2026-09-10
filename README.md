# Slice

Build your own index of Coinbase tokenized stocks on Base, then hold it.

Live: https://mirrl.xyz

## What it does

1. Weight any of the eleven Coinbase-issued B20 stocks (NVDAc, AAPLc, MSFTc, GOOGLc, AMZNc, METAc, TSLAc, MSTRc, SPCXc, SNDKc, COINc), or start from a preset.
2. The index is priced live from the Chainlink tokenized-equity feeds on Base, with a freshness badge per feed. Equity feeds heartbeat every 24 h and stop moving when the market is closed, so a price without its age is not a price.
3. Connect a wallet, or paste any Base address, and see what it really holds. Holdings are read with `scaledBalanceOf`, so corporate-action multipliers are applied. One B20 token is not always one share.
4. Slice computes the exact buys and sells to reach your weights and links each one, prefilled, on CoW Swap and Aerodrome. You sign in your own wallet. Nothing is custodied, nothing is executed by Slice.
5. The URL is the index. Copy it and anyone can rebalance their own wallet to your weights.

## Why this and not a wrapper token

An index token needs an issuer, a mint path and a redemption path, which means a custodian and a compliance surface. A personal index needs none of that: the stocks are already self-custodied B20 tokens, the prices are already onchain, and the trades already have venues. What was missing was the arithmetic and the links.

## Run it

```
cd web-next
npm install
npm run dev
```

Deployed on Vercel; `npm run build` for a production build.

## Addresses

Coinbase's published list is at https://www.base.org/stocks. Registry `0x3f3E8cf41cdd3b1D118c16471aB0113DfDDd5CaD`. Token and feed addresses are in `web-next/app/chain.js` and in the page footer.

Coinbase tokenized stocks are offered under Regulation S in eligible jurisdictions outside the United States. Slice is a planning tool; it does not offer, sell or execute anything.
