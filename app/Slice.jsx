'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient } from 'wagmi';
import { isAddress } from 'viem';
import { B20_ABI, EXPLORER, FEED_ABI, PRESETS, REGISTRY, SAMPLE_HOLDER, STOCKS, venues } from './chain';

const usd = (n, d = 2) => (n == null || Number.isNaN(n) ? '—' : n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: d }));
const num = (n, d = 4) => (n == null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: d }));
const pct = (n) => (n == null ? '—' : `${n.toFixed(1)}%`);
const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');

/** How much to trust a Chainlink equity print. */
function freshness(updatedAt) {
  const age = Date.now() / 1000 - Number(updatedAt);
  if (age > 24 * 3600 + 900) return { cls: 'stale', label: 'stale', age };
  if (age > 2 * 3600) return { cls: 'closed', label: 'market closed', age };
  return { cls: 'live', label: 'live', age };
}
const ago = (s) => (s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${(s / 3600).toFixed(1)}h` : `${(s / 86400).toFixed(1)}d`);

function readHash() {
  if (typeof window === 'undefined') return null;
  const h = new URLSearchParams(window.location.hash.slice(1));
  const w = h.get('w');
  if (!w) return null;
  const weights = {};
  for (const part of w.split(',')) {
    const [sym, v] = part.split(':');
    if (STOCKS.some((s) => s.sym === sym) && Number.isFinite(+v)) weights[sym] = +v;
  }
  return { weights, notional: +h.get('n') || 1000, name: h.get('name') || '' };
}

export default function Slice() {
  const client = usePublicClient();
  const { address: connected } = useAccount();

  const [weights, setWeights] = useState(PRESETS['Mag 7']);
  const [name, setName] = useState('Mag 7');
  const [notional, setNotional] = useState(1000);
  const [viewAddr, setViewAddr] = useState('');
  const [prices, setPrices] = useState({});
  const [holdings, setHoldings] = useState({});
  const [loading, setLoading] = useState(true);
  const [useWallet, setUseWallet] = useState(true);
  const [copied, setCopied] = useState(false);

  // a shared link overrides the default preset
  useEffect(() => {
    const h = readHash();
    if (h) { setWeights(h.weights); setNotional(h.notional); setName(h.name || 'Shared'); }
  }, []);

  // keep the URL shareable at all times
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = Object.entries(weights).filter(([, v]) => v > 0).map(([k, v]) => `${k}:${v}`).join(',');
    // hand-built so the link stays readable: #w=NVDA:20,AAPL:15&n=1000&name=Mag%207
    window.history.replaceState(null, '', `#w=${w}&n=${notional}&name=${encodeURIComponent(name)}`);
  }, [weights, notional, name]);

  const target = connected && useWallet ? connected : (isAddress(viewAddr) ? viewAddr : null);

  // ---- prices: one multicall across every Chainlink equity feed -----------
  const loadPrices = useCallback(async () => {
    if (!client) return;
    try {
      const res = await client.multicall({
        contracts: STOCKS.map((s) => ({ address: s.feed, abi: FEED_ABI, functionName: 'latestRoundData' })),
        allowFailure: true,
      });
      const next = {};
      res.forEach((r, i) => {
        if (r.status === 'success') {
          const [, answer, , updatedAt] = r.result;
          next[STOCKS[i].sym] = { price: Number(answer) / 1e8, updatedAt: Number(updatedAt) };
        }
      });
      setPrices(next);
    } catch { /* transient rpc */ } finally { setLoading(false); }
  }, [client]);

  // ---- holdings: scaledBalanceOf, so corporate-action multipliers are applied
  const loadHoldings = useCallback(async () => {
    if (!client || !target) { setHoldings({}); return; }
    try {
      const res = await client.multicall({
        contracts: STOCKS.map((s) => ({ address: s.token, abi: B20_ABI, functionName: 'scaledBalanceOf', args: [target] })),
        allowFailure: true,
      });
      const next = {};
      res.forEach((r, i) => { if (r.status === 'success') next[STOCKS[i].sym] = Number(r.result) / 1e8; });
      setHoldings(next);
    } catch { /* transient rpc */ }
  }, [client, target]);

  useEffect(() => { loadPrices(); const t = setInterval(loadPrices, 60_000); return () => clearInterval(t); }, [loadPrices]);
  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  // ---- the index -----------------------------------------------------------
  const totalW = Object.values(weights).reduce((a, b) => a + (+b || 0), 0);
  const balanced = Math.abs(totalW - 100) < 0.01;

  const portfolio = useMemo(() => {
    let value = 0;
    const rows = STOCKS.map((s) => {
      const p = prices[s.sym]?.price ?? null;
      const shares = holdings[s.sym] ?? 0;
      const v = p != null ? shares * p : 0;
      value += v;
      return { ...s, price: p, shares, value: v };
    });
    return { rows, value };
  }, [prices, holdings]);

  const hasHoldings = portfolio.value > 0;
  const base = hasHoldings ? portfolio.value : notional;

  const plan = useMemo(() => portfolio.rows.map((r) => {
    const w = (+weights[r.sym] || 0) / (totalW || 100);
    const targetUsd = base * w;
    const targetShares = r.price ? targetUsd / r.price : null;
    const delta = targetUsd - r.value;
    return { ...r, w, targetUsd, targetShares, delta, curW: base ? r.value / base : 0 };
  }), [portfolio, weights, totalW, base]);

  const trades = plan.filter((p) => Math.abs(p.delta) >= 1 && (p.w > 0 || p.shares > 0)).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const worst = Object.values(prices).map((p) => freshness(p.updatedAt)).sort((a, b) => b.age - a.age)[0];
  const preset = Object.entries(PRESETS).find(([, w]) => JSON.stringify(w) === JSON.stringify(weights))?.[0];

  const setW = (sym, v) => setWeights((w) => ({ ...w, [sym]: v === '' ? 0 : Math.max(0, Math.min(100, +v)) }));
  const normalise = () => {
    if (!totalW) return;
    setWeights((w) => Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round((v / totalW) * 1000) / 10])));
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <>
      <div className="wrap">
        <div className="top">
          <a className="brand" href="#top" aria-label="Mirrl">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill="currentColor"/><path d="M12 12 L21 12 A9 9 0 1 1 12 3 Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            Mirrl
          </a>
          <span className="chip">Base · Coinbase tokenized stocks</span>
          <span className="spacer" />
          <a className="btn btn--sm" href="https://github.com/Nuel-osas/slice">Code</a>
          <ConnectButton chainStatus="none" showBalance={false} accountStatus="address" />
        </div>

        <div className="hero-s" id="top">
          <h1>Build your own index of tokenized stocks. Then hold it.</h1>
          <p className="sub">
            Weight any of the {STOCKS.length} Coinbase-issued stocks on Base. Mirrl prices the index from the
            Chainlink equity feeds, reads what a wallet really holds after corporate-action multipliers, and
            hands you the exact trades to get to target. Nothing is custodied; every trade happens in your wallet on a venue Coinbase lists.
          </p>
          <div className="presets">
            {Object.entries(PRESETS).map(([k, w]) => (
              <button key={k} className={`pill ${preset === k ? 'on' : ''}`} onClick={() => { setWeights(w); setName(k); }}>{k}</button>
            ))}
            <button className="pill" onClick={() => { setWeights({}); setName('My index'); }}>Blank</button>
          </div>
        </div>

        <div className="layout">
          {/* ---- weights + prices ---- */}
          <section className="panel">
            <div className="panel__head">
              <h2>Index</h2>
              <div className="inline">
                <input className="field" style={{ width: 150 }} value={name} onChange={(e) => setName(e.target.value)} aria-label="Index name" />
                {worst && <span className={`badge ${worst.cls}`}>oracle {worst.label}, {ago(worst.age)} ago</span>}
              </div>
            </div>
            <div className="scroll-x">
              <table className="stocks">
                <thead><tr><th>Stock</th><th className="num">Price</th><th>Feed</th><th className="num">Weight %</th><th className="num">Target</th></tr></thead>
                <tbody>
                  {plan.map((r) => {
                    const f = prices[r.sym] ? freshness(prices[r.sym].updatedAt) : null;
                    return (
                      <tr key={r.sym}>
                        <td><span className="tk">{r.sym}c<small>{r.name}</small></span></td>
                        <td className="num">{loading ? '…' : usd(r.price)}</td>
                        <td>{f && <span className={`badge ${f.cls}`}>{ago(f.age)}</span>}</td>
                        <td className="num">
                          <input className="w" type="number" min="0" max="100" step="1" value={weights[r.sym] ?? ''} placeholder="0" onChange={(e) => setW(r.sym, e.target.value)} aria-label={`${r.sym} weight`} />
                          <div className="bar"><i style={{ width: `${Math.min(100, (+weights[r.sym] || 0))}%` }} /></div>
                        </td>
                        <td className="num">{r.w > 0 ? <>{usd(r.targetUsd, 0)}<br /><small className="muted">{num(r.targetShares)} sh</small></> : <span className="muted">—</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="total">
              <span>Weights sum to <b className={balanced ? '' : 'bad'}>{totalW.toFixed(1)}%</b>{!balanced && totalW > 0 && <> · <a href="#" onClick={(e) => { e.preventDefault(); normalise(); }}>normalise to 100</a></>}</span>
              <span className="inline">
                <label htmlFor="notional">Size</label>
                <input id="notional" className="field" style={{ width: 110 }} type="number" min="1" value={notional} onChange={(e) => setNotional(Math.max(1, +e.target.value || 0))} disabled={hasHoldings} />
                <span>USD</span>
              </span>
            </div>
            <div className="panel__body">
              <div className="inline">
                <button className="btn btn--sm" onClick={share}>{copied ? 'Copied' : 'Copy share link'}</button>
                <span className="muted">The URL is the index. Send it to anyone; they see your weights and can rebalance their own wallet to them.</span>
              </div>
            </div>
          </section>

          {/* ---- wallet + plan ---- */}
          <aside className="panel">
            <div className="panel__head"><h2>Wallet</h2>{target && <a className="badge" href={`${EXPLORER}/address/${target}`}>{short(target)}</a>}</div>
            <div className="panel__body">
              {!connected && (
                <div className="inline" style={{ marginBottom: 12 }}>
                  <input className="field addr" placeholder="Paste any Base address" value={viewAddr} onChange={(e) => setViewAddr(e.target.value.trim())} />
                  <button className="btn btn--sm" onClick={() => setViewAddr(SAMPLE_HOLDER)}>Sample holder</button>
                </div>
              )}
              {connected && (
                <label className="inline muted" style={{ marginBottom: 12 }}>
                  <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} /> use connected wallet
                  {!useWallet && <input className="field addr" placeholder="or paste an address" value={viewAddr} onChange={(e) => setViewAddr(e.target.value.trim())} />}
                </label>
              )}

              <span className="lbl">{hasHoldings ? 'Tokenized stock held' : 'Plan size'}</span>
              <div className="big">{usd(base, 0)}<span className="u">USD</span></div>
              {hasHoldings ? (
                <dl className="kv">
                  {portfolio.rows.filter((r) => r.shares > 0).map((r) => (
                    <div key={r.sym} style={{ display: 'contents' }}>
                      <dt>{r.sym}c <span className="muted">{num(r.shares)} sh · {pct(r.value / base * 100)}</span></dt>
                      <dd>{usd(r.value, 0)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="muted" style={{ marginTop: 8 }}>
                  {target ? 'This address holds no Coinbase tokenized stock. The plan below buys the index from zero.' : 'Connect or paste an address to plan against a real position. Until then the plan buys the index from zero.'}
                </p>
              )}

              <div className="plan">
                <span className="lbl">{hasHoldings ? 'Rebalance to target' : 'Trades to build it'}</span>
                {trades.length === 0 && <div className="empty">{totalW ? 'Already on target.' : 'Set some weights.'}</div>}
                {trades.map((t) => {
                  const side = t.delta > 0 ? 'buy' : 'sell';
                  const v = venues(t.token, side);
                  return (
                    <div className="trade" key={t.sym}>
                      <span className={`side ${side}`}>{side.toUpperCase()}</span>
                      <span className="what">{usd(Math.abs(t.delta), 0)} {t.sym}c<small>{t.price ? num(Math.abs(t.delta) / t.price) : '—'} sh · {pct(t.curW * 100)} → {pct(t.w * 100)}</small></span>
                      <span className="links"><a href={v.cow} target="_blank" rel="noreferrer">CoW</a><a href={v.aero} target="_blank" rel="noreferrer">Aerodrome</a></span>
                    </div>
                  );
                })}
              </div>
              {trades.length > 0 && <p className="muted" style={{ marginTop: 12 }}>Each link opens the swap prefilled with the right pair on Base. You sign in your own wallet. Sizes assume the last oracle print; check the venue quote.</p>}
            </div>
          </aside>
        </div>
      </div>

      <footer className="foot">
        <div className="wrap">
          <p>
            Prices are Chainlink equity feeds on Base. Holdings are read with <code>scaledBalanceOf</code>, so corporate-action multipliers are applied.
            Mirrl plans and links; every trade is signed in your own wallet. Coinbase tokenized stocks are available in eligible jurisdictions outside the United States.
          </p>
          <details className="verify">
            <summary>Verify contract addresses</summary>
            <p className="muted">Only tokens on <a href="https://www.base.org/stocks">Coinbase&rsquo;s published list</a> are issued by Coinbase. These are the ones Mirrl uses.</p>
            <div className="scroll-x">
              <table className="addrs"><tbody>
                <tr><td>Registry</td><td><a href={`${EXPLORER}/address/${REGISTRY}`}>{REGISTRY}</a></td></tr>
                {STOCKS.map((s) => <tr key={s.sym}><td>{s.sym}c</td><td><a href={`${EXPLORER}/token/${s.token}`}>{s.token}</a></td><td>feed <a href={`${EXPLORER}/address/${s.feed}`}>{short(s.feed)}</a></td></tr>)}
              </tbody></table>
            </div>
          </details>
          <p className="fine">Mirrl &middot; <a href="https://github.com/Nuel-osas/slice">GitHub</a></p>
        </div>
      </footer>
    </>
  );
}
