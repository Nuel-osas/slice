/**
 * In-app execution through the KyberSwap aggregator on Base, which is on
 * Coinbase's published venue list for these tokens. Mirrl never holds funds:
 * the aggregator router pulls tokenIn from the connected wallet inside the
 * same transaction the user signs.
 *
 * Executing ourselves means the jurisdiction check is ours as well. Coinbase
 * tokenized stocks are offered under Regulation S to non-US persons, so the
 * trade path is gated on a geo lookup plus an explicit attestation.
 */
import { erc20Abi, maxUint256 } from 'viem';
import { USDC } from './chain';

const KYBER = 'https://aggregator-api.kyberswap.com/base/api/v1';
const HEADERS = { 'x-client-id': 'mirrl' };
export const ELIGIBLE_KEY = 'mirrl.eligible.v1';

export async function geoBlocked() {
  try {
    const r = await fetch('https://ipwho.is/', { cache: 'no-store' });
    const j = await r.json();
    return j?.success ? j.country_code === 'US' : false;
  } catch { return false; }
}

export async function quote(tokenIn, tokenOut, amountIn) {
  const u = `${KYBER}/routes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn.toString()}`;
  const j = await (await fetch(u, { headers: HEADERS })).json();
  if (j.code !== 0) throw new Error(j.message || 'No route');
  return { summary: j.data.routeSummary, router: j.data.routerAddress };
}

export async function build(summary, sender) {
  const j = await (await fetch(`${KYBER}/route/build`, {
    method: 'POST', headers: { ...HEADERS, 'content-type': 'application/json' },
    body: JSON.stringify({ routeSummary: summary, sender, recipient: sender, slippageTolerance: 100, source: 'mirrl' }),
  })).json();
  if (j.code !== 0) throw new Error(j.message || 'Could not build route');
  return j.data; // { routerAddress, data, amountOut, gas }
}

/**
 * One leg: approve if needed, then swap. Reports progress through `say`.
 * Returns the swap tx hash.
 */
export async function executeLeg({ walletClient, publicClient, account, tokenIn, tokenOut, amountIn, say }) {
  say('Fetching route…');
  const { summary, router } = await quote(tokenIn, tokenOut, amountIn);
  const tx = await build(summary, account);

  const allowance = await publicClient.readContract({ address: tokenIn, abi: erc20Abi, functionName: 'allowance', args: [account, router] });
  if (allowance < amountIn) {
    say('Approve in your wallet…');
    const h = await walletClient.writeContract({ address: tokenIn, abi: erc20Abi, functionName: 'approve', args: [router, tokenIn.toLowerCase() === USDC.toLowerCase() ? maxUint256 : amountIn], account });
    say('Waiting for approval…');
    await publicClient.waitForTransactionReceipt({ hash: h });
  }

  say('Confirm the swap in your wallet…');
  const hash = await walletClient.sendTransaction({ to: tx.routerAddress, data: tx.data, value: 0n, gas: BigInt(Math.ceil(Number(tx.gas) * 1.3)), account });
  say('Swapping…');
  const rc = await publicClient.waitForTransactionReceipt({ hash });
  if (rc.status !== 'success') throw new Error('Swap reverted');
  return hash;
}
