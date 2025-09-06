import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Toronto Neighbourhood Safety — Toronto Police Service Major Crime Indicators";
export const size = {
  width: 1200,
  height: 630,
};

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

        {/* Tag */}
        <div
          style={{
            marginTop: 64,
            marginLeft: 80,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 12px",
            borderRadius: 10,
            background: "rgba(14,165,233,0.18)",
            border: "1px solid rgba(56,189,248,0.45)",
            color: "#c7ebff",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <div
            style={{ width: 10, height: 10, borderRadius: 10, background: "#38bdf8" }}
          />
          Toronto Safety
        </div>

        {/* Title and subtitle */}
        <div style={{ marginLeft: 80, marginTop: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.12 }}>
            Toronto Neighbourhood Safety
          </div>
          <div style={{ marginTop: 14, fontSize: 30, opacity: 0.9 }}>
            Toronto Police Service Major Crime Indicators
          </div>
          <div
            style={{
              marginTop: 18,
              width: 560,
              height: 5,
              borderRadius: 3,
              background: "#7dd3fc",
              opacity: 0.75,
            }}
          />
        </div>

        {/* Right accent: pin + rings */}
        <div
          style={{
            position: "absolute",
            right: 200,
            top: 160,
            width: 220,
            height: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* rings */}
          {[110, 70, 38].map((r, i) => (
            <div
              key={r}
              style={{
                position: "absolute",
                width: r * 2,
                height: r * 2,
                borderRadius: r * 2,
                border: `2px solid ${i === 0 ? "rgba(96,165,250,0.10)" : i === 1 ? "rgba(56,189,248,0.16)" : "rgba(34,211,238,0.22)"}`,
              }}
            />
          ))}
          {/* pin */}
          <div
            style={{
              width: 44,
              height: 44,
              color: "#7dd3fc",
              filter: "drop-shadow(0 0 10px rgba(34,211,238,0.3))",
            }}
          >
            <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
              <path d="M12 2c4.05 0 7 2.98 7 6.86 0 4.88-5.45 10.35-6.64 11.48a.5.5 0 0 1-.72 0C10.45 19.21 5 13.74 5 8.86 5 4.98 7.95 2 12 2zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
            </svg>
          </div>
        </div>

        {/* CN tower */}
        <div
          style={{ position: "absolute", right: 120, bottom: 64, opacity: 0.18, color: "#7dd3fc" }}
        >
          <svg viewBox="0 0 200 60" width="220" height="66" fill="currentColor">
            <path d="M100 2 l6 0 0 6 18 3 -18 3 0 5 10 3 -10 3 0 25 -4 8 -4 -8 0 -25 -10 -3 10 -3 0 -5 -18 -3 18 -3 0 -6z" />
            <rect x="0" y="52" width="200" height="8" rx="2" ry="2" />
          </svg>
        </div>
      </div>
    ),
    size
  );
}

