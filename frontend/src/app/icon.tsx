import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 18, background: "linear-gradient(145deg, #7770e5, #4c68c4)", color: "white", fontSize: 34, fontWeight: 800 }}>
      P
    </div>,
    size,
  );
}
