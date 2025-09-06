import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)",
          borderRadius: 36,
        }}
      >
        {/* pin mark */}
        <svg width="112" height="112" viewBox="0 0 24 24" fill="#fff" style={{ opacity: 0.95 }}>
          <path d="M12 2c4.05 0 7 2.98 7 6.86 0 4.88-5.45 10.35-6.64 11.48a.5.5 0 0 1-.72 0C10.45 19.21 5 13.74 5 8.86 5 4.98 7.95 2 12 2zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
        </svg>
      </div>
    ),
    size
  );
}

