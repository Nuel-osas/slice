const puppeteer = require('/Users/emmanuelosadebe/.npm/_npx/7d92d9a2d2ccc630/node_modules/puppeteer');
const A = '0x853F5f1B92b16714Fe6CDA67CAad0856B83C7ab9';
const out = 'public/shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--hide-scrollbars', '--force-device-scale-factor=1'] });
  const pg = await b.newPage();
  const only = process.argv.slice(2);
  const shot = async (name, url, h = 1080, ready, after) => {
    if (only.length && !only.includes(name)) return;
    await pg.setViewport({ width: 1920, height: h });
    await pg.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    if (ready) await pg.waitForFunction(ready, { timeout: 45000 });
    if (after) await after();
    await sleep(600);
    await pg.screenshot({ path: `${out}/${name}.png` });
    console.log('ok', name);
  };
  const pricesLoaded = () => { const t = document.querySelector('.stocks')?.innerText || ''; return /\$\d/.test(t) && !t.includes('…'); };
  const holdingsLoaded = () => /rebalance to target/i.test(document.body.innerText) && /NVDAc\s+[\d,]+(\.\d+)? sh/i.test(document.body.innerText);
  await shot('hero', 'https://mirrl.xyz/', 1080, pricesLoaded);
  await shot('ai', 'https://mirrl.xyz/?v=2#w=NVDA:40,MSFT:20,GOOGL:20,SNDK:20&n=1000&name=AI%20build-out', 1080, pricesLoaded);
  await shot('table', 'https://mirrl.xyz/', 1500, pricesLoaded);
  await shot('wallet', `https://mirrl.xyz/?a=${A}`, 1500, () => (/rebalance to target/i.test(document.body.innerText) && /NVDAc\s+[\d,]+(\.\d+)? sh/i.test(document.body.innerText)) && (() => { const t = document.querySelector('.stocks')?.innerText || ''; return /\$\d/.test(t) && !t.includes('…'); })());
  await shot('moon', `https://mirrl.xyz/?a=${A}#w=SPCX:50,TSLA:30,MSTR:20&n=1000&name=Moonshots`, 1500, holdingsLoaded);
  await shot('cow', 'https://swap.cow.fi/#/8453/swap/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/0xb20000000000000000000078ee7ce2fE4908108C', 1080, null, async () => {
    try { const [btn] = await pg.$$('xpath/.//button[contains(., "Swap now")]'); if (btn) { await btn.click(); await sleep(2500); } } catch {}
    await pg.waitForFunction(() => /NVDAC/i.test(document.body.innerText), { timeout: 30000 }).catch(() => {});
  });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
