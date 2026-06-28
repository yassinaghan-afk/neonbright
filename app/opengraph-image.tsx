import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "Neon Bright – Néon LED & Enseignes Lumineuses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), "public/brand/logo-wide.png");
  let logoData: string;
  try {
    const buf = await readFile(logoPath);
    logoData = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoData = "";
  }

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
          background: "#050505",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255,45,149,0.18) 0%, transparent 60%)",
          }}
        />

        {/* Logo */}
        {logoData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoData}
            alt="Neon Bright"
            style={{ height: 160, width: "auto" }}
          />
        ) : (
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800 }}>
            <span style={{ color: "#ff2d95" }}>NEON</span>
            <span style={{ color: "#fff", marginLeft: 20 }}>BRIGHT</span>
          </div>
        )}

        <p
          style={{
            marginTop: 32,
            fontSize: 28,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.12em",
            fontWeight: 400,
          }}
        >
          Néon LED &amp; Enseignes Lumineuses sur Mesure · Maroc
        </p>
      </div>
    ),
    { ...size }
  );
}
