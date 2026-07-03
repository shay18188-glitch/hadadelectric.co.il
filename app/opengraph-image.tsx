import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "חדד יובל אלקטריק בע״מ — מוצרי חשמל בנהריה והצפון";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const fontData = await fetch(new URL("../public/fonts/Rubik-Hebrew-Bold.ttf", import.meta.url)).then((res) =>
    res.arrayBuffer()
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10151c 0%, #0b63f6 100%)",
          color: "#fff",
          fontFamily: "Rubik",
          textAlign: "center",
          padding: "0 80px",
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.85, marginBottom: 24, display: "flex" }}>
          חדד יובל אלקטריק בע״מ
        </div>
        <div style={{ fontSize: 64, display: "flex" }}>מוצרי חשמל בנהריה והצפון</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Rubik", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
