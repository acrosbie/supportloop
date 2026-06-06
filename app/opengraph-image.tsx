import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SupportLoop — AI customer support, as a closed loop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #4d57c0 0%, #5e6ad2 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "34px", fontWeight: 700 }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "15px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            SL
          </div>
          <div>SupportLoop</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ fontSize: "70px", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "920px" }}>
            AI customer support, as a closed loop.
          </div>
          <div style={{ fontSize: "30px", opacity: 0.9 }}>
            Self-service · agent assist · knowledge generation · ops analytics
          </div>
        </div>

        <div style={{ fontSize: "24px", opacity: 0.8 }}>A reference implementation · Next.js · Supabase · Claude</div>
      </div>
    ),
    { ...size }
  );
}
