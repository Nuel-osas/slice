import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const KEY = (await readFile("/Users/emmanuelosadebe/Downloads/projects/hackies/api.md", "utf8")).trim();
const BRIAN = "nPczCjzI2devNBz1zQrb";
const NAME = "mirrl"; const MUSIC_MS = 90_000;
const LINES = [
  ["x1", "Coinbase put eleven real stocks on Base. Apple, Nvidia, Tesla, and eight more, as tokens you hold yourself."],
  ["x2", "Mirrl turns them into an index you design."],
  ["x3", "Pick a preset, or set your own weights. Prices come straight from the Chainlink equity feeds on Base."],
  ["x4", "Every price shows its age. Equity feeds pause when the market closes, so a price without its age is not a price."],
  ["x5", "Connect a wallet, or paste any Base address, and see what it really holds."],
  ["x6", "Mirrl reads balances after corporate action multipliers. One token is not always one share."],
  ["x7", "Then it gives you the exact trades to reach your weights. Each one opens prefilled on CoW Swap or Aerodrome, and you sign in your own wallet."],
  ["x8", "Nothing is custodied. No wrapper token, no issuer. Everything an index needs was already on Base."],
  ["x9", "The link is the index. Send it to a friend, and they can hold the same thing. Mirrl, at mirrl dot x y z."],
];
const MUSIC_PROMPT = "Calm, clean, modern instrumental for a fintech product film. Warm keys, soft muted pulse, gentle forward motion, quietly confident. No vocals, no drops, no big builds. It must sit under a spoken voiceover.";
const VOICE = { stability: 0.4, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true };
async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${url} ${r.status}: ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}
const OUT = `public/vo-${NAME}`; await mkdir(OUT, { recursive: true });
const mode = process.argv[2] ?? "all";
if (mode !== "music") for (const [id, text] of LINES) {
  if (/[—–]/.test(text)) throw new Error(`${id} has a dash`);
  process.stdout.write(`vo ${id}… `);
  const b = await post(`https://api.elevenlabs.io/v1/text-to-speech/${BRIAN}`, { text, model_id: "eleven_multilingual_v2", voice_settings: VOICE });
  await writeFile(join(OUT, `${id}.mp3`), b); console.log(`${(b.length/1024).toFixed(0)}kb`);
}
if (mode !== "vo") { process.stdout.write("music… "); const b = await post("https://api.elevenlabs.io/v1/music", { prompt: MUSIC_PROMPT, music_length_ms: MUSIC_MS }); await writeFile(`public/${NAME}-bed.mp3`, b); console.log(`${(b.length/1024).toFixed(0)}kb`); }
