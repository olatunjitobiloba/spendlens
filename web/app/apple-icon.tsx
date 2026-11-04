import { ImageResponse } from "next/og";

import { LOGO_RING, LOGO_SLICE } from "@/components/brand/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#007BF5" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
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
      </div>
    ),
    size,
  );
}
