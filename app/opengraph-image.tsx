import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "חדד יובל אלקטריק בע״מ — מוצרי חשמל בנהריה והצפון";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori (next/og) does not run the Unicode bidi algorithm, so Hebrew renders
 * with reversed character and word order. Pre-reversing the whole string
 * cancels that out and produces correctly-shaped RTL text in the image.
 */
function rtl(text: string): string {
  return text.split("").reverse().join("");
}

/** Base64-encode an ArrayBuffer without Node's Buffer (edge-runtime safe). */
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default async function OgImage() {
  const [fontData, logoData] = await Promise.all([
    fetch(new URL("../public/fonts/Rubik-Hebrew-Bold.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("../public/brand/logo.png", import.meta.url)).then((res) => res.arrayBuffer()),
  ]);

  // logo.png ships as JPEG bytes; use the matching mime so Satori decodes it.
  const logoSrc = `data:image/jpeg;base64,${toBase64(logoData)}`;

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
          background: "#ffffff",
          fontFamily: "Rubik",
          textAlign: "center",
          padding: "0 80px",
          borderBottom: "16px solid #0b63f6",
          direction: "rtl",
        }}
      >
        <img src={logoSrc} width={300} height={297} alt="" style={{ marginBottom: 36 }} />
        <div style={{ fontSize: 58, fontWeight: 700, color: "#10151c", display: "flex" }}>
          {rtl("מוצרי חשמל בנהריה והצפון")}
        </div>
        <div style={{ fontSize: 30, color: "#0b63f6", marginTop: 18, display: "flex" }}>
          {rtl("חדד יובל אלקטריק · משלוח והתקנה בכל אזור הצפון")}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Rubik", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
