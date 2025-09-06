import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Toronto Neighbourhood Safety — Toronto Police Service Major Crime Indicators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0b1020 0%, #0c2d57 100%)",
          color: "#fff",
          position: "relative",
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(200,231,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(200,231,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px, 24px 24px",
          }}
        />

        {/* cyan vignette */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -60,
            width: 700,
            height: 700,
            borderRadius: 700,
            background: "radial-gradient(closest-side, rgba(14,165,233,0.20), rgba(14,165,233,0.06) 60%, transparent 100%)",
            filter: "blur(0.3px)",
          }}
        />

        {/* Title and subtitle (center stage) */}
        <div style={{ marginLeft: 80, marginTop: 60 }}>
          <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.06 }}>
            <div>Toronto Neighbourhood</div>
            <div>Safety</div>
          </div>
          <div style={{ marginTop: 16, fontSize: 30, opacity: 0.9 }}>
            Toronto Police Service Major Crime Indicators
          </div>
          <div
            style={{
              marginTop: 16,
              width: 680,
              height: 4,
              borderRadius: 3,
              background: "#7dd3fc",
              opacity: 0.75,
            }}
          />
        </div>

        {/* No rings; clean background only */}
      </div>
    ),
    size
  );
}
