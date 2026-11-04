import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { LOGO_RING, LOGO_SLICE } from "@/components/brand/logo";

export const alt =
  "SpendLens: know what you can cut, before you cut it. A spending review API for banks and fintech apps.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#09090B";
const PAPER = "#F6F6F4";
const BLUE = "#007BF5";
const MUTED = "#A1A1AA";
const LINE = "rgba(255,255,255,0.09)";

const rows: { name: string; value: string; locked?: boolean }[] = [
  { name: "Rent", value: "Protected", locked: true },
  { name: "Food and groceries", value: "Protected", locked: true },
  { name: "Eating out", value: "−20%" },
  { name: "Subscriptions", value: "−30%" },
  { name: "Transport", value: "−10%" },
];

const fontDir = join(process.cwd(), "public/fonts");
const [regular, semibold] = await Promise.all([
  readFile(join(fontDir, "Aspekta-400.otf")),
  readFile(join(fontDir, "Aspekta-600.otf")),
]);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: INK,
          color: PAPER,
          fontFamily: "Aspekta",
          padding: "64px 72px",
        }}
      >
        {/* Left: brand and promise */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="44" height="44" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="9" fill={BLUE} />
              <circle
                cx={LOGO_RING.cx}
                cy={LOGO_RING.cy}
                r={LOGO_RING.r}
                fill="none"
                stroke="#fff"
                strokeWidth={LOGO_RING.stroke}
              />
              <path d={LOGO_SLICE} fill="#fff" />
            </svg>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em" }}>spendlens</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 64,
              fontSize: 66,
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              fontWeight: 400,
            }}
          >
            Know what you can cut, before you cut it.
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 26, color: MUTED, lineHeight: 1.35 }}>
            The spending review API for banks and fintech apps.
          </div>

          <div style={{ display: "flex", marginTop: "auto", fontSize: 20, color: MUTED, gap: 10 }}>
            <span style={{ color: PAPER }}>Code does the maths.</span>
            <span>AI only explains it.</span>
          </div>
        </div>

        {/* Right: a scenario card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 400,
            alignSelf: "center",
            background: "#111114",
            border: `1px solid ${LINE}`,
            borderRadius: 28,
            padding: 30,
          }}
        >
          <div style={{ display: "flex", fontSize: 18, color: MUTED }}>Scenario · October</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
            {rows.map((r) => (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "13px 0",
                  borderBottom: `1px solid ${LINE}`,
                  fontSize: 20,
                }}
              >
                <span style={{ color: r.locked ? MUTED : PAPER }}>{r.name}</span>
                <span style={{ color: r.locked ? MUTED : BLUE, fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: 22,
            }}
          >
            <span style={{ fontSize: 20, color: MUTED }}>Monthly spend</span>
            <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>−5.3%</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Aspekta", data: regular, weight: 400, style: "normal" },
        { name: "Aspekta", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
