/**
 * Coinbase tokenized stocks on Base. Every token is a B20 precompile issued by
 * Coinbase; the list is the one published at base.org/stocks. If an address is
 * not here, Coinbase did not issue it.
 *
 * Prices come from the Chainlink tokenized-equity feeds on Base. They are
 * total-return values, already multiplier-adjusted, 8 decimals, and update on
 * a 0.5% move or a 24 h heartbeat. Read updatedAt before trusting one.
 */
export const STOCKS = [
  { sym: 'NVDA',  name: 'NVIDIA',        token: '0xb20000000000000000000078ee7ce2fE4908108C', feed: '0x04689a41629776563E6822F76f2e57D148d28513' },
  { sym: 'AAPL',  name: 'Apple',         token: '0xb200000000000000000000C2e324d24d7eEcd1fb', feed: '0x787f13dEa48Db0897CbCDD985de77809D837F988' },
  { sym: 'MSFT',  name: 'Microsoft',     token: '0xB200000000000000000000Ab99cFa739E253872B', feed: '0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c' },
  { sym: 'GOOGL', name: 'Alphabet',      token: '0xb2000000000000000000002D0BA3164cc74f58B7', feed: '0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2' },
  { sym: 'AMZN',  name: 'Amazon',        token: '0xb200000000000000000000d9192b6B456483C2E8', feed: '0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295' },
  { sym: 'META',  name: 'Meta',          token: '0xb2000000000000000000008bC8786B856E61707C', feed: '0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D' },
  { sym: 'TSLA',  name: 'Tesla',         token: '0xb2000000000000000000001e800a7f5189430cD0', feed: '0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4' },
  { sym: 'MSTR',  name: 'MicroStrategy', token: '0xb2000000000000000000004884b426556b92883d', feed: '0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a' },
  { sym: 'SPCX',  name: 'SpaceX',        token: '0xb2000000000000000000007b9fcbd005511aCBd5', feed: '0x6A634B235903C4ad6376892180d6fF8612e3Fa68' },
  { sym: 'SNDK',  name: 'SanDisk',       token: '0xb200000000000000000000397293Cb8cda9a10c5', feed: '0x388b0dC46C0Fb05A74BeE0994fa5b02c6Fcca2eA' },
  { sym: 'COIN',  name: 'Coinbase',      token: '0xb200000000000000000000c85a31389D71F3ecfb', feed: '0x408e44f504A7371a345F03a73dDC96A4b48e8aa7' },
];

export const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
export const REGISTRY = '0x3f3E8cf41cdd3b1D118c16471aB0113DfDDd5CaD';
export const EXPLORER = 'https://base.blockscout.com';

/** A wallet that actually holds tokenized stock, so the page has something to show before you connect. */
export const SAMPLE_HOLDER = '0x853F5f1B92b16714Fe6CDA67CAad0856B83C7ab9';

export const PRESETS = {
  'Mag 7':        { NVDA: 20, AAPL: 15, MSFT: 15, GOOGL: 15, AMZN: 15, META: 10, TSLA: 10 },
  'AI build-out': { NVDA: 40, MSFT: 20, GOOGL: 20, SNDK: 20 },
  'Crypto beta':  { COIN: 40, MSTR: 40, TSLA: 20 },
  'Moonshots':    { SPCX: 50, TSLA: 30, MSTR: 20 },
};

export const B20_ABI = [
  { type: 'function', name: 'scaledBalanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'multiplier', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
];

export const FEED_ABI = [
  { type: 'function', name: 'latestRoundData', stateMutability: 'view', inputs: [],
    outputs: [{ type: 'uint80' }, { type: 'int256' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'uint80' }] },
];

/** Trade links. Both venues are on Coinbase's published list for these tokens. */
export const venues = (token, side) => ({
  cow: side === 'buy'
    ? `https://swap.cow.fi/#/8453/swap/${USDC}/${token}`
    : `https://swap.cow.fi/#/8453/swap/${token}/${USDC}`,
  aero: side === 'buy'
    ? `https://aerodrome.finance/swap?from=${USDC}&to=${token}`
    : `https://aerodrome.finance/swap?from=${token}&to=${USDC}`,
});
