import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: SANS } = loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });

/** Mirrl's own palette: the light product UI, Base blue for the one thing that matters. */
const C = {
  ground: "#efefef", panel: "#ffffff", ink: "#111114", muted: "#3f3f46", dim: "#7a7a85",
  blue: "#0052ff", blueWash: "#eef3ff", good: "#12a15a", goodWash: "#e7f7ee", amber: "#d99a06", amberWash: "#fff6df",
  line: "rgba(17,17,20,0.10)",
};

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

/** Scene lengths are the measured voiceover clips plus 1.2 s. Do not guess these. */
const SCENES = [
  { id: "x1", dur: s(8.7) }, { id: "x2", dur: s(3.6) }, { id: "x3", dur: s(7.2) }, { id: "x4", dur: s(8.4) },
  { id: "x5", dur: s(5.1) }, { id: "x6", dur: s(7.0) }, { id: "x7", dur: s(9.4) }, { id: "x8", dur: s(8.4) }, { id: "x9", dur: s(8.7) },
];
export const MIRRL_DURATION = SCENES.reduce((a, b) => a + b.dur, 0);
const VO_OFFSET = 7;

function easeUp(frame: number, start: number, dur = 16, rise = 22): React.CSSProperties {
  const t = interpolate(frame - start, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = 1 - Math.pow(1 - t, 3);
  return { opacity: e, transform: `translateY(${(1 - e) * rise}px)` };
}
function fadeInOut(frame: number, total: number, edge = 9) {
  return interpolate(frame, [0, edge, total - edge, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

const Mark: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = C.blue }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 12 L12 3 A9 9 0 0 1 21 12 Z" fill={color} /><path d="M12 12 L21 12 A9 9 0 1 1 12 3 Z" fill="none" stroke={color} strokeWidth="1.5" /></svg>
);

const Frame: React.FC<{ children: React.ReactNode; bg?: string; total: number }> = ({ children, bg = C.ground, total }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: SANS, color: C.ink, opacity: fadeInOut(f, total) }}>
      {children}
      <div style={{ position: "absolute", left: 64, bottom: 48, display: "flex", alignItems: "center", gap: 12, opacity: 0.9 }}>
        <Mark size={26} color={bg === C.blue ? "#fff" : C.blue} />
        <span style={{ fontWeight: 700, fontSize: 22, color: bg === C.blue ? "#fff" : C.ink, letterSpacing: -0.3 }}>Mirrl</span>
      </div>
      <div style={{ position: "absolute", right: 64, bottom: 52, fontFamily: MONO, fontSize: 16, color: bg === C.blue ? "rgba(255,255,255,.7)" : C.dim }}>mirrl.xyz</div>
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ children: React.ReactNode; size?: number; color?: string; start?: number; maxWidth?: number }> = ({ children, size = 96, color = C.ink, start = 0, maxWidth = 1300 }) => {
  const f = useCurrentFrame();
  return <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.04, letterSpacing: -size * 0.032, color, maxWidth, ...easeUp(f, start) }}>{children}</div>;
};

/** A product screenshot in a soft window frame, with an optional slow push-in on a focal point. */
const Shot: React.FC<{ src: string; start?: number; from?: number; to?: number; origin?: string; y?: number; scale?: number; w?: number; h?: number; clipH?: number }> =
  ({ src, start = 0, from = 1, to = 1.04, origin = "50% 30%", y = 0, w = 1640, h = 920, clipH }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [start, start + 240], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: (1920 - w) / 2, top: 80, width: w, height: h, borderRadius: 22, overflow: "hidden", background: "#fff",
      boxShadow: "0 30px 80px -30px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.06)", ...easeUp(f, start, 18, 28) }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z}) translateY(${-y}px)`, transformOrigin: origin }}>
        <Img src={staticFile(src)} style={{ width: w, height: clipH ?? "auto", objectFit: "cover", objectPosition: "top" }} />
      </div>
    </div>
  );
};

/** A region of a capture, blown up. Used where the full page would show chrome or geo banners irrelevant to the viewer. */
const Crop: React.FC<{ src: string; start?: number; sx: number; sy: number; sw: number; sh: number; scale: number }> = ({ src, start = 0, sx, sy, sw, sh, scale }) => {
  const f = useCurrentFrame();
  const w = sw * scale, h = sh * scale;
  const z = interpolate(f, [start, start + 200], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: (1920 - w) / 2, top: (1080 - h) / 2 - 40, width: w, height: h, borderRadius: 28, overflow: "hidden",
      boxShadow: "0 40px 90px -30px rgba(0,0,0,.45), 0 0 0 1px rgba(0,0,0,.08)", transform: `scale(${z})`, ...easeUp(f, start, 18, 28) }}>
      <Img src={staticFile(src)} style={{ position: "absolute", left: -sx * scale, top: -sy * scale, width: 1920 * scale, height: "auto" }} />
    </div>
  );
};

const Callout: React.FC<{ x: number; y: number; start: number; children: React.ReactNode; tone?: "blue" | "amber" | "good" }> = ({ x, y, start, children, tone = "blue" }) => {
  const f = useCurrentFrame();
  const bg = tone === "amber" ? C.amberWash : tone === "good" ? C.goodWash : C.blueWash;
  const fg = tone === "amber" ? C.amber : tone === "good" ? C.good : C.blue;
  return (
    <div style={{ position: "absolute", left: x, top: y, padding: "12px 18px", borderRadius: 999, background: bg, color: fg, fontWeight: 600, fontSize: 24,
      boxShadow: "0 12px 30px -14px rgba(0,0,0,.35)", ...easeUp(f, start, 14, 14) }}>{children}</div>
  );
};

// ── scenes ──────────────────────────────────────────────────────────────────

const S1: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  const tickers = ["NVDAc", "AAPLc", "MSFTc", "GOOGLc", "AMZNc", "METAc", "TSLAc", "MSTRc", "SPCXc", "SNDKc", "COINc"];
  return (
    <Frame total={total}>
      <div style={{ position: "absolute", left: 120, top: 200 }}>
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.dim, letterSpacing: 2, ...easeUp(f, 0) }}>COINBASE TOKENIZED STOCKS · BASE</div>
        <div style={{ height: 28 }} />
        <Headline start={6}>Eleven real stocks.<br />On Base. In your wallet.</Headline>
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 700, display: "flex", gap: 14, flexWrap: "wrap" }}>
        {tickers.map((t, i) => (
          <div key={t} style={{ padding: "14px 22px", borderRadius: 999, background: C.panel, border: `1px solid ${C.line}`, fontWeight: 600, fontSize: 26, ...easeUp(f, 40 + i * 4) }}>{t}</div>
        ))}
      </div>
    </Frame>
  );
};

const S2: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <Frame total={total} bg={C.blue}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, ...easeUp(f, 0) }}><Mark size={84} color="#fff" /><span style={{ fontSize: 120, fontWeight: 700, color: "#fff", letterSpacing: -4 }}>Mirrl</span></div>
        <div style={{ fontSize: 44, color: "rgba(255,255,255,.85)", fontWeight: 500, ...easeUp(f, 10) }}>An index you design.</div>
      </div>
    </Frame>
  );
};

const S3: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  const swap = Math.round(total * 0.52);
  return (
    <Frame total={total}>
      {f < swap + 8 && <div style={{ position: "absolute", inset: 0, opacity: interpolate(f, [swap, swap + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><Shot src="shots/hero.png" origin="50% 45%" to={1.06} /></div>}
      {f >= swap && <Shot src="shots/ai.png" start={swap} origin="50% 60%" from={1.06} to={1.1} />}
      <Callout x={1290} y={112} start={30}>Chainlink equity feeds</Callout>
    </Frame>
  );
};

const S4: React.FC<{ total: number }> = ({ total }) => (
  <Frame total={total}>
    <Shot src="shots/table.png" origin="36% 20%" from={1.55} to={1.65} y={330} clipH={1500 * (1640 / 1920)} />
    <Callout x={1040} y={330} start={40} tone="amber">market closed · 10.5h ago</Callout>
    <Callout x={1040} y={410} start={52} tone="good">live · 1m ago</Callout>
  </Frame>
);

const S5: React.FC<{ total: number }> = ({ total }) => (
  <Frame total={total}>
    <Shot src="shots/wallet.png" origin="84% 26%" from={1.45} to={1.52} y={330} clipH={1500 * (1640 / 1920)} />
    <Callout x={150} y={150} start={30}>0x853F…7ab9 · a real Base wallet</Callout>
  </Frame>
);

const S6: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <Frame total={total}>
      <div style={{ position: "absolute", left: 120, top: 170 }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: C.blue, ...easeUp(f, 0) }}>scaledBalanceOf(wallet)</div>
        <div style={{ height: 22 }} />
        <div style={{ fontSize: 150, fontWeight: 700, letterSpacing: -6, lineHeight: 1, ...easeUp(f, 8) }}>6,700.90<span style={{ fontSize: 44, color: C.dim, marginLeft: 18, letterSpacing: 0 }}>NVDAc shares</span></div>
        <div style={{ height: 44 }} />
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontFamily: MONO, fontSize: 30, color: C.muted, ...easeUp(f, 24) }}>
          <span style={{ padding: "10px 18px", background: C.panel, borderRadius: 12, border: `1px solid ${C.line}` }}>raw balance</span><span>×</span>
          <span style={{ padding: "10px 18px", background: C.panel, borderRadius: 12, border: `1px solid ${C.line}` }}>multiplier</span><span>=</span>
          <span style={{ padding: "10px 18px", background: C.blueWash, color: C.blue, borderRadius: 12 }}>shares you can redeem</span>
        </div>
        <div style={{ height: 60 }} />
        <Headline size={64} start={44} maxWidth={1500}>One token is not always one share.</Headline>
      </div>
    </Frame>
  );
};

const S7: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  const swap = Math.round(total * 0.6);
  return (
    <Frame total={total}>
      {f < swap + 8 && <div style={{ position: "absolute", inset: 0, opacity: interpolate(f, [swap, swap + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}><Shot src="shots/wallet.png" origin="84% 55%" from={1.45} to={1.52} y={560} clipH={1500 * (1640 / 1920)} /></div>}
      {f >= swap && <Crop src="shots/cow.png" start={swap} sx={725} sy={150} sw={470} sh={285} scale={2.6} />}
      {f < swap && <Callout x={150} y={140} start={20} tone="good">exact buys and sells</Callout>}
      {f >= swap && <Callout x={150} y={140} start={swap + 10}>prefilled on CoW Swap · you sign</Callout>}
    </Frame>
  );
};

const S8: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  const rows = ["No wrapper token", "No issuer", "No custodian"];
  return (
    <Frame total={total} bg={C.blue}>
      <div style={{ position: "absolute", left: 120, top: 200 }}>
        <Headline color="#fff" start={0}>Nothing is custodied.</Headline>
        <div style={{ height: 70 }} />
        {rows.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 46, color: "rgba(255,255,255,.92)", fontWeight: 500, padding: "18px 0", borderTop: "1px solid rgba(255,255,255,.22)", width: 900, ...easeUp(f, 24 + i * 8) }}>
            <span style={{ fontFamily: MONO, fontSize: 24, color: "rgba(255,255,255,.6)", width: 40 }}>0{i + 1}</span>{r}
          </div>
        ))}
        <div style={{ fontSize: 30, color: "rgba(255,255,255,.7)", marginTop: 40, ...easeUp(f, 60) }}>Everything an index needs was already on Base.</div>
      </div>
    </Frame>
  );
};

const S9: React.FC<{ total: number }> = ({ total }) => {
  const f = useCurrentFrame();
  return (
    <Frame total={total}>
      <div style={{ position: "absolute", left: 120, top: 180 }}>
        <Headline start={0}>The link is the index.</Headline>
        <div style={{ height: 40 }} />
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, padding: "22px 28px", background: C.panel, borderRadius: 16, border: `1px solid ${C.line}`, ...easeUp(f, 14) }}>
          mirrl.xyz/#w=<span style={{ color: C.blue }}>NVDA:20,AAPL:15,MSFT:15,GOOGL:15,AMZN:15,META:10,TSLA:10</span>&amp;name=Mag+7
        </div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 620, display: "flex", alignItems: "center", gap: 22, ...easeUp(f, 120) }}>
        <Mark size={72} /><span style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3 }}>Mirrl</span>
        <span style={{ fontFamily: MONO, fontSize: 40, color: C.dim, marginLeft: 30 }}>mirrl.xyz</span>
      </div>
    </Frame>
  );
};

const PARTS = [S1, S2, S3, S4, S5, S6, S7, S8, S9];

export const Mirrl: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: C.ground }}>
      <Audio src={staticFile("mirrl-bed.mp3")} volume={0.14} />
      {SCENES.map((sc, i) => {
        const P = PARTS[i]; const from = at; at += sc.dur;
        return (
          <Sequence key={sc.id} from={from} durationInFrames={sc.dur}>
            <P total={sc.dur} />
            <Sequence from={VO_OFFSET}><Audio src={staticFile(`vo-mirrl/${sc.id}.mp3`)} /></Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
