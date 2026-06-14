export function buildNeonTextStyle(color: string, intensity: number) {
  const t = intensity / 100;
  const blur1 = 4 + t * 8;
  const blur2 = 12 + t * 20;
  const blur3 = 24 + t * 40;
  const blur4 = 48 + t * 60;

  return {
    color,
    textShadow: [
      `0 0 ${blur1}px ${color}`,
      `0 0 ${blur2}px ${color}`,
      `0 0 ${blur3}px ${color}cc`,
      `0 0 ${blur4}px ${color}66`,
    ].join(", "),
  } as Record<string, string>;
}

export function buildNeonLogoFilter(color: string, intensity: number) {
  const t = intensity / 100;
  const blur = 4 + t * 16;
  return {
    filter: `drop-shadow(0 0 ${blur}px ${color}) drop-shadow(0 0 ${blur * 2}px ${color}aa)`,
  } as Record<string, string>;
}

export function isPreviewableLogo(type: string) {
  return type.startsWith("image/") && (type.includes("png") || type.includes("svg"));
}
